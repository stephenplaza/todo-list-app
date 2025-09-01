#!/usr/bin/env python3

import json
import urllib.request
import urllib.parse
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.error import HTTPError

class ClaudeProxyHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        """Handle POST requests to Claude API"""
        if self.path != '/api/claude':
            self.send_error(404)
            return
        
        try:
            # Read request body
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            api_key = data.get('apiKey')
            todo_text = data.get('todoText')
            
            if not api_key:
                self.send_error(400, 'API key is required')
                return
            
            # Prepare Claude API request
            claude_data = {
                "model": "claude-3-sonnet-20240229",
                "max_tokens": 500,
                "messages": [{
                    "role": "user",
                    "content": f"Please provide a helpful summary and analysis of this todo list. Include insights about productivity patterns, priorities, and any recommendations:\n\n{todo_text}"
                }]
            }
            
            # Make request to Claude API
            req = urllib.request.Request(
                'https://api.anthropic.com/v1/messages',
                data=json.dumps(claude_data).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'x-api-key': api_key,
                    'anthropic-version': '2023-06-01'
                },
                method='POST'
            )
            
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                
                # Send successful response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode('utf-8'))
        
        except HTTPError as e:
            try:
                error_body = e.read().decode('utf-8')
                error_data = json.loads(error_body)
            except:
                error_data = {"error": {"message": f"HTTP {e.code}: {e.reason}"}}
            
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_data).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            error_response = {"error": {"message": str(e)}}
            self.wfile.write(json.dumps(error_response).encode('utf-8'))

def run_server():
    server = HTTPServer(('localhost', 3001), ClaudeProxyHandler)
    print("Claude API proxy server running on http://localhost:3001")
    print("Press Ctrl+C to stop the server")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.shutdown()

if __name__ == '__main__':
    run_server()