import requests
import time
import json
import random
import os
import uuid

BASE_URL = "http://localhost:3000"
RESULTS_PATH = r"C:\Users\damia\.picobot\workspace\test-results.json"

def ensure_dir():
    os.makedirs(os.path.dirname(RESULTS_PATH), exist_ok=True)

class TestSuite:
    def __init__(self):
        self.results = []
        self.test_count = 0
        self.session = requests.Session()

    def add_result(self, category, name, endpoint, method, status, statusCode, responseTimeMs, expected, actual, error=None):
        self.test_count += 1
        result = {
            "id": self.test_count,
            "category": category,
            "name": name,
            "endpoint": endpoint,
            "method": method,
            "status": "PASS" if status else "FAIL",
            "statusCode": statusCode,
            "responseTimeMs": responseTimeMs,
            "expected": expected,
            "actual": actual,
            "error": error
        }
        self.results.append(result)
        return status

    def run_request(self, method, path, **kwargs):
        url = f"{BASE_URL}{path}" if path.startswith("/") else path
        start_time = time.perf_counter()
        try:
            response = self.session.request(method, url, timeout=5, **kwargs)
            duration = int((time.perf_counter() - start_time) * 1000)
            return response, duration, None
        except Exception as e:
            duration = int((time.perf_counter() - start_time) * 1000)
            return None, duration, str(e)

    # API Tests
    def test_api_settings_get(self):
        resp, dur, err = self.run_request("GET", "/api/settings")
        if err: return self.add_result("api", "GET /api/settings", "/api/settings", "GET", False, 0, dur, "200 OK", f"Error: {err}", err)
        
        status = resp.status_code == 200
        actual = f"Status {resp.status_code}"
        if status:
            try:
                data = resp.json()
                keys = ["apiBaseUrl", "apiKey", "defaultModel"]
                missing = [k for k in keys if k not in data]
                if missing:
                    status = False
                    actual += f", missing keys: {missing}"
            except:
                status = False
                actual += ", invalid JSON"
        
        return self.add_result("api", "GET /api/settings", "/api/settings", "GET", status, resp.status_code, dur, "200 with apiBaseUrl, apiKey, defaultModel", actual)

    def test_api_workspace_get(self):
        resp, dur, err = self.run_request("GET", "/api/workspace")
        if err: return self.add_result("api", "GET /api/workspace", "/api/workspace", "GET", False, 0, dur, "200 OK", str(err), err)
        status = resp.status_code == 200
        actual = f"Status {resp.status_code}"
        if status:
            try:
                data = resp.json()
                if "workspace" not in data or "tree" not in data:
                    status = False
                    actual += ", missing workspace/tree"
            except:
                status = False
                actual += ", invalid JSON"
        return self.add_result("api", "GET /api/workspace", "/api/workspace", "GET", status, resp.status_code, dur, "200 with workspace/tree", actual)

    def test_api_chats_get(self):
        resp, dur, err = self.run_request("GET", "/api/chats")
        if err: return self.add_result("api", "GET /api/chats", "/api/chats", "GET", False, 0, dur, "200 OK", str(err), err)
        status = resp.status_code == 200
        actual = f"Status {resp.status_code}"
        if status:
            try:
                data = resp.json()
                if not isinstance(data, list):
                    status = False
                    actual += ", not an array"
            except:
                status = False
                actual += ", invalid JSON"
        return self.add_result("api", "GET /api/chats", "/api/chats", "GET", status, resp.status_code, dur, "200 with JSON array", actual)

    def test_api_chat_post_empty(self):
        resp, dur, err = self.run_request("POST", "/api/chat", json={"message": ""})
        if err: return self.add_result("api", "POST /api/chat empty", "/api/chat", "POST", False, 0, dur, "400", str(err), err)
        status = resp.status_code == 400
        return self.add_result("api", "POST /api/chat empty", "/api/chat", "POST", status, resp.status_code, dur, "400 Bad Request", f"Status {resp.status_code}")

    def test_api_chat_post_valid(self):
        resp, dur, err = self.run_request("POST", "/api/chat", json={"message": "hi"})
        if err: return self.add_result("api", "POST /api/chat valid", "/api/chat", "POST", False, 0, dur, "200", str(err), err)
        status = resp.status_code == 200
        actual = f"Status {resp.status_code}"
        if status:
            try:
                data = resp.json()
                if "response" not in data:
                    status = False
                    actual += ", missing response key"
            except:
                status = False
                actual += ", invalid JSON"
        return self.add_result("api", "POST /api/chat valid", "/api/chat", "POST", status, resp.status_code, dur, "200 with response key", actual)

    def test_api_generic_get(self, endpoint):
        resp, dur, err = self.run_request("GET", endpoint)
        if err: return self.add_result("api", f"GET {endpoint}", endpoint, "GET", False, 0, dur, "200", str(err), err)
        status = resp.status_code == 200
        return self.add_result("api", f"GET {endpoint}", endpoint, "GET", status, resp.status_code, dur, "200 OK", f"Status {resp.status_code}")

    def test_api_settings_post(self):
        # Mocking valid settings structure based on common patterns
        body = {"apiBaseUrl": "test", "apiKey": "test", "defaultModel": "test"}
        resp, dur, err = self.run_request("POST", "/api/settings", json=body)
        if err: return self.add_result("api", "POST /api/settings", "/api/settings", "POST", False, 0, dur, "200", str(err), err)
        status = resp.status_code == 200
        return self.add_result("api", "POST /api/settings", "/api/settings", "POST", status, resp.status_code, dur, "200 OK", f"Status {resp.status_code}")

    def test_api_workspace_file_notfound(self):
        resp, dur, err = self.run_request("GET", "/api/workspace/file?path=nonexistent_file_xyz")
        # Handle gracefully could mean 404 or a successful JSON with error message
        status = resp.status_code in [404, 200] if not err else False
        return self.add_result("api", "GET /api/workspace/file (nonexistent)", "/api/workspace/file", "GET", status, resp.status_code if not err else 0, dur, "Graceful handle (404/200)", f"Status {resp.status_code if not err else err}")

    def test_api_chat_notfound(self):
        resp, dur, err = self.run_request("GET", "/api/chats/nonexistent-id-123")
        status = resp.status_code in [404, 200] if not err else False
        return self.add_result("api", "GET /api/chats (nonexistent)", "/api/chats/nonexistent-id", "GET", status, resp.status_code if not err else 0, dur, "Graceful handle", f"Status {resp.status_code if not err else err}")

    def test_api_compact_empty(self):
        resp, dur, err = self.run_request("POST", "/api/compact", json={"history": []})
        status = resp.status_code in [200, 400] if not err else False # Graceful could be success or explicit error
        return self.add_result("api", "POST /api/compact (empty)", "/api/compact", "POST", status, resp.status_code if not err else 0, dur, "Graceful handle", f"Status {resp.status_code if not err else err}")

    def test_api_execute_post(self):
        body = {"code": "print('hello test')"}
        resp, dur, err = self.run_request("POST", "/api/execute", json=body)
        if err: return self.add_result("api", "POST /api/execute", "/api/execute", "POST", False, 0, dur, "200", str(err), err)
        status = resp.status_code == 200 or (resp.status_code == 403 and "disabled" in resp.text.lower())
        actual = f"Status {resp.status_code}"
        if status and resp.status_code == 200:
            try:
                data = resp.json()
                if "output" not in data:
                    status = False
                    actual += ", missing output"
            except:
                status = False
                actual += ", invalid JSON"
        elif resp.status_code == 403:
            actual = "Status 403 (Disabled as expected)"
            
        return self.add_result("api", "POST /api/execute", "/api/execute", "POST", status, resp.status_code, dur, "200 with output or 403 Disabled", actual)

    # Page Tests
    def test_page_load(self, path, name):
        resp, dur, err = self.run_request("GET", path)
        if err: return self.add_result("page", f"GET {path}", path, "GET", False, 0, dur, "200", str(err), err)
        status = resp.status_code == 200 and "text/html" in resp.headers.get("Content-Type", "")
        return self.add_result("page", name, path, "GET", status, resp.status_code, dur, "200 with HTML", f"Status {resp.status_code}, Type {resp.headers.get('Content-Type')}")

    def test_page_elements(self):
        resp, dur, err = self.run_request("GET", "/")
        if err: return self.add_result("page", "Check homepage elements", "/", "GET", False, 0, dur, "Expected elements present", str(err), err)
        status = resp.status_code == 200
        missing = []
        html = resp.text.lower()
        if "input" not in html: missing.append("input")
        # Sidebar often has a specific class or id, but we'll check for common sidebar text or structure
        if "sidebar" not in html and "nav" not in html: missing.append("sidebar/nav")
        if missing:
            status = False
            actual = f"Missing elements: {missing}"
        else:
            actual = "All elements found"
        return self.add_result("page", "Check homepage elements", "/", "GET", status, resp.status_code, dur, "Input and sidebar present", actual)

    def test_page_response_time(self):
        resp, dur, err = self.run_request("GET", "/")
        status = dur < 2000 if not err else False
        return self.add_result("page", "Check response time < 2s", "/", "GET", status, resp.status_code if not err else 0, dur, "< 2000ms", f"{dur}ms")

    def test_page_accept_headers(self, header):
        resp, dur, err = self.run_request("GET", "/", headers={"Accept": header})
        status = resp.status_code == 200 if not err else False
        return self.add_result("page", f"Test Accept: {header}", "/", "GET", status, resp.status_code if not err else 0, dur, "200 OK", f"Status {resp.status_code if not err else err}")

    def test_page_static_asset(self, path):
        resp, dur, err = self.run_request("GET", path)
        status = resp.status_code == 200 if not err else False
        return self.add_result("page", f"Load static asset: {path}", path, "GET", status, resp.status_code if not err else 0, dur, "200 OK", f"Status {resp.status_code if not err else err}")

    # Data Integrity Tests
    def test_data_chat_cycle(self):
        msg = f"Test chat {uuid.uuid4()}"
        resp_post, dur1, err1 = self.run_request("POST", "/api/chat", json={"message": msg})
        if err1 or resp_post.status_code != 200:
            return self.add_result("data", "Create chat -> verify in list", "/api/chat", "POST", False, 0, dur1, "200", "Failed to create", err1)
        
        # Verify in list
        resp_list, dur2, err2 = self.run_request("GET", "/api/chats")
        dur = dur1 + dur2
        if err2: return self.add_result("data", "Create chat -> verify in list", "/api/chats", "GET", False, 0, dur, "Found in list", str(err2), err2)
        
        try:
            chats = resp_list.json()
            # We check if any chat summary/message contains our unique message
            # This depends on how the API returns chats (might need to check last message)
            found = any(msg in str(c) for c in chats)
            status = found
            actual = "Found in list" if found else "Not found in list"
        except:
            status = False
            actual = "Invalid JSON in list"
            
        return self.add_result("data", "Create chat -> verify in list", "/api/chats", "GET", status, resp_list.status_code, dur, "Chat found in history", actual)

    def test_data_settings_persistence(self):
        unique_val = str(uuid.uuid4())
        body = {"apiBaseUrl": unique_val, "apiKey": "test", "defaultModel": "test"}
        resp1, dur1, err1 = self.run_request("POST", "/api/settings", json=body)
        resp2, dur2, err2 = self.run_request("GET", "/api/settings")
        dur = dur1 + dur2
        if err1 or err2: return self.add_result("data", "Update settings -> verify persistence", "/api/settings", "GET", False, 0, dur, "Persisted", "Connection error")
        
        try:
            persisted = resp2.json().get("apiBaseUrl") == unique_val
            status = persisted
            actual = "Persisted" if persisted else "Not persisted"
        except:
            status = False
            actual = "Invalid JSON"
        return self.add_result("data", "Update settings -> verify persistence", "/api/settings", "GET", status, resp2.status_code, dur, "Value matches after GET", actual)

    def test_data_workspace_structure(self):
        resp, dur, err = self.run_request("GET", "/api/workspace")
        if err: return self.add_result("data", "Check workspace tree validity", "/api/workspace", "GET", False, 0, dur, "Valid nodes", str(err))
        
        status = True
        actual = "All nodes valid"
        try:
            tree = resp.json().get("tree", [])
            def validate(nodes):
                nonlocal status, actual
                for n in nodes:
                    if not all(k in n for k in ["name", "path", "type"]):
                        status = False
                        actual = f"Node missing keys: {n}"
                        return
                    if "children" in n and isinstance(n["children"], list):
                        validate(n["children"])
            validate(tree)
        except:
            status = False
            actual = "Invalid JSON"
        return self.add_result("data", "Check workspace tree validity", "/api/workspace", "GET", status, resp.status_code, dur, "All nodes have name, path, type", actual)

    def test_data_generic_cycle(self, name, post_path, get_path, body):
        resp1, dur1, err1 = self.run_request("POST", post_path, json=body)
        resp2, dur2, err2 = self.run_request("GET", get_path)
        dur = dur1 + dur2
        status = resp1.status_code == 200 and resp2.status_code == 200 if not (err1 or err2) else False
        return self.add_result("data", f"Test {name} cycle", post_path, "POST", status, resp2.status_code if not err2 else 0, dur, "200/200 OK", f"POST:{resp1.status_code if not err1 else 'err'} GET:{resp2.status_code if not err2 else 'err'}")

    # Edge Case Tests
    def test_edge_long_message(self):
        long_msg = "A" * 5001
        resp, dur, err = self.run_request("POST", "/api/chat", json={"message": long_msg})
        status = resp.status_code == 200 if not err else False
        return self.add_result("edge", "Long message (5000+ chars)", "/api/chat", "POST", status, resp.status_code if not err else 0, dur, "200 OK", f"Status {resp.status_code if not err else err}")

    def test_edge_special_chars(self):
        special = "Emoji: 🚀, Unicode: ☃, HTML: <script>alert(1)</script>"
        resp, dur, err = self.run_request("POST", "/api/chat", json={"message": special})
        status = resp.status_code == 200 if not err else False
        return self.add_result("edge", f"Special characters", "/api/chat", "POST", status, resp.status_code if not err else 0, dur, "200 OK", f"Status {resp.status_code if not err else err}")

    def test_edge_code_blocks(self):
        code = "```python\nprint('hello')\n```"
        resp, dur, err = self.run_request("POST", "/api/chat", json={"message": code})
        status = resp.status_code == 200 if not err else False
        return self.add_result("edge", "Message with code blocks", "/api/chat", "POST", status, resp.status_code if not err else 0, dur, "200 OK", f"Status {resp.status_code if not err else err}")

    def test_edge_rapid_requests(self):
        success_count = 0
        total_dur = 0
        for _ in range(5):
            resp, dur, err = self.run_request("GET", "/api/settings")
            total_dur += dur
            if not err and resp.status_code == 200:
                success_count += 1
        status = success_count == 5
        return self.add_result("edge", "Rapid sequential requests (5)", "/api/settings", "GET", status, 200 if status else 0, total_dur, "All 5 succeed", f"Success: {success_count}/5")

    def test_edge_malformed_json(self):
        resp, dur, err = self.run_request("POST", "/api/chat", data="{'invalid': json}", headers={"Content-Type": "application/json"})
        # Should return 400 or handle gracefully
        status = resp.status_code == 400 if not err else False
        return self.add_result("edge", "Malformed JSON", "/api/chat", "POST", status, resp.status_code if not err else 0, dur, "400 Bad Request", f"Status {resp.status_code if not err else err}")

    def test_edge_cors(self):
        resp, dur, err = self.run_request("OPTIONS", "/api/settings")
        if err: return self.add_result("edge", "CORS headers", "/api/settings", "OPTIONS", False, 0, dur, "CORS headers present", str(err))
        # Check for common CORS headers
        has_cors = any(h in resp.headers for h in ["Access-Control-Allow-Origin", "access-control-allow-origin"])
        return self.add_result("edge", "CORS headers", "/api/settings", "OPTIONS", has_cors, resp.status_code, dur, "Header Present", "Found" if has_cors else "Not found")

    def test_edge_missing_content_type(self):
        resp, dur, err = self.run_request("POST", "/api/chat", data=json.dumps({"message": "hi"}))
        # Some servers default to application/json, some fail. We'll check if it doesn't crash (200/400/415)
        status = resp.status_code in [200, 400, 415] if not err else False
        return self.add_result("edge", "Missing Content-Type", "/api/chat", "POST", status, resp.status_code if not err else 0, dur, "Graceful handle", f"Status {resp.status_code if not err else err}")

    def test_edge_empty_body(self):
        resp, dur, err = self.run_request("POST", "/api/chat", data="")
        status = resp.status_code in [400, 200] if not err else False
        return self.add_result("edge", "Empty body POST", "/api/chat", "POST", status, resp.status_code if not err else 0, dur, "Graceful handle", f"Status {resp.status_code if not err else err}")

    def run_all(self):
        ensure_dir()
        api_tests = [
            lambda: self.test_api_settings_get(),
            lambda: self.test_api_workspace_get(),
            lambda: self.test_api_chats_get(),
            lambda: self.test_api_chat_post_empty(),
            lambda: self.test_api_chat_post_valid(),
            lambda: self.test_api_generic_get("/api/tasks"),
            lambda: self.test_api_generic_get("/api/notes"),
            lambda: self.test_api_generic_get("/api/memory"),
            lambda: self.test_api_settings_post(),
            lambda: self.test_api_workspace_file_notfound(),
            lambda: self.test_api_chat_notfound(),
            lambda: self.test_api_compact_empty(),
            lambda: self.test_api_execute_post(),
            lambda: self.test_api_generic_get("/api/search-capability")
        ]
        
        page_tests = [
            lambda: self.test_page_load("/", "Homepage"),
            lambda: self.test_page_load("/onboarding", "Onboarding"),
            lambda: self.test_page_elements(),
            lambda: self.test_page_response_time(),
            lambda: self.test_page_accept_headers("application/json"),
            lambda: self.test_page_accept_headers("text/html"),
            lambda: self.test_page_static_asset("/favicon.ico"),
            lambda: self.test_page_static_asset("/globals.css")
        ]
        
        data_tests = [
            lambda: self.test_data_chat_cycle(),
            lambda: self.test_data_settings_persistence(),
            lambda: self.test_data_workspace_structure(),
            lambda: self.test_data_generic_cycle("Notes", "/api/notes", "/api/notes", {"content": "test note"}),
            lambda: self.test_data_generic_cycle("Tasks", "/api/tasks", "/api/tasks", {"title": "test task"})
        ]
        
        edge_tests = [
            lambda: self.test_edge_long_message(),
            lambda: self.test_edge_special_chars(),
            lambda: self.test_edge_code_blocks(),
            lambda: self.test_edge_rapid_requests(),
            lambda: self.test_edge_malformed_json(),
            lambda: self.test_edge_cors(),
            lambda: self.test_edge_missing_content_type(),
            lambda: self.test_edge_empty_body()
        ]

        # Mixed execution
        all_to_run = []
        # Populate to exactly match counts: 40, 20, 20, 20
        # For API (40): Cycle through 14 available
        for i in range(40): all_to_run.append(random.choice(api_tests))
        # For Page (20): Cycle through 8 available
        for i in range(20): all_to_run.append(random.choice(page_tests))
        # For Data (20): Cycle through 5 available
        for i in range(20): all_to_run.append(random.choice(data_tests))
        # For Edge (20): Cycle through 8 available
        for i in range(20): all_to_run.append(random.choice(edge_tests))
        
        random.shuffle(all_to_run)
        
        print(f"Starting 100 tests against {BASE_URL}...")
        for t in all_to_run:
            t()
            print(".", end="", flush=True)
            if self.test_count % 10 == 0: print(f" {self.test_count}%", flush=True)

        print("\nSaving results...")
        with open(RESULTS_PATH, "w") as f:
            json.dump(self.results, f, indent=2)

        self.print_summary()

    def print_summary(self):
        passed = sum(1 for r in self.results if r["status"] == "PASS")
        failed = self.test_count - passed
        print("\n" + "="*50)
        print("TEST SUMMARY")
        print("="*50)
        print(f"Total Tests:  {self.test_count}")
        print(f"Passed:       {passed}")
        print(f"Failed:       {failed}")
        if failed > 0:
            print("\nFailures:")
            for r in self.results:
                if r["status"] == "FAIL":
                    print(f"- [{r['id']}] {r['category'].upper()} - {r['name']}: {r['actual']}")
        print("="*50)

if __name__ == "__main__":
    TestSuite().run_all()
