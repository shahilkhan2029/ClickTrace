import os
import sys
import time
import socket
import subprocess
import webbrowser
import signal
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"

def is_port_open(port: int, host: str = "127.0.0.1") -> bool:
    """Fast, silent check if a TCP port is open."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.5)
            return s.connect_ex((host, port)) == 0
    except Exception:
        return False

def wait_for_port(port: int, max_wait: float = 15.0, host: str = "127.0.0.1") -> bool:
    """Wait until port is accepting connections."""
    start = time.time()
    while time.time() - start < max_wait:
        if is_port_open(port, host):
            return True
        time.sleep(0.3)
    return False

def find_ollama_binary() -> str:
    """Find ollama executable in PATH or standard user location."""
    import shutil
    bin_in_path = shutil.which("ollama")
    if bin_in_path:
        return bin_in_path
    
    appdata = os.getenv("LOCALAPPDATA", "")
    candidate = Path(appdata) / "Programs" / "Ollama" / "ollama.exe"
    if candidate.exists():
        return str(candidate)
    
    return "ollama"

processes = []

def cleanup(signum=None, frame=None):
    print("\nShutting down ClickTrace services cleanly...")
    for p in processes:
        try:
            p.terminate()
            p.wait(timeout=2)
        except Exception:
            try:
                p.kill()
            except Exception:
                pass
    print("All services stopped.")
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup)
signal.signal(signal.SIGTERM, cleanup)

def main():
    print("=" * 70)
    print("        CLICKTRACE - AI-POWERED WEBSITE UX INTELLIGENCE        ")
    print("=" * 70)
    print()

    # 1. Start Ollama
    print("[1/3] Checking Ollama AI Service (:11434)...", end="", flush=True)
    if not is_port_open(11434):
        ollama_bin = find_ollama_binary()
        try:
            ollama_proc = subprocess.Popen(
                [ollama_bin, "serve"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
            )
            processes.append(ollama_proc)
            if wait_for_port(11434, max_wait=8):
                print(" Started & Ready [Gemma 2B]")
            else:
                print(" Starting in background")
        except Exception as e:
            print(f" Warning: Could not start Ollama ({e})")
    else:
        print(" Already Active [Gemma 2B]")

    # 2. Start FastAPI Backend
    print("[2/3] Starting FastAPI Backend (:8000)...", end="", flush=True)
    if not is_port_open(8000):
        backend_proc = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "8000"],
            cwd=str(ROOT_DIR),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
        )
        processes.append(backend_proc)
        if wait_for_port(8000, max_wait=10):
            print(" Active & Healthy")
        else:
            print(" Starting up...")
    else:
        print(" Already Active")

    # 3. Start React Frontend
    print("[3/3] Starting React Dashboard (:5173)...", end="", flush=True)
    if not is_port_open(5173):
        # On Windows, npm is a batch script npm.cmd
        npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
        frontend_proc = subprocess.Popen(
            [npm_cmd, "run", "dev"],
            cwd=str(FRONTEND_DIR),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
        )
        processes.append(frontend_proc)
        if wait_for_port(5173, max_wait=12):
            print(" Active & Ready")
        else:
            print(" Starting up...")
    else:
        print(" Already Active")

    print()
    print("=" * 70)
    print("                     ALL SERVICES ARE RUNNING!                         ")
    print("=" * 70)
    print("  * Dashboard:     http://localhost:5173")
    print("  * Demo Site:     http://127.0.0.1:8000/demo/index.html")
    print("  * SDK Endpoint:  http://127.0.0.1:8000/sdk/clicktrace.js")
    print("  * API Docs:      http://127.0.0.1:8000/docs")
    print("  * Local Model:   gemma:2b via Ollama on :11434")
    print("=" * 70)
    print()
    print("Opening ClickTrace Dashboard in your browser...")
    webbrowser.open("http://localhost:5173")

    print("\nPress Ctrl+C to stop all services cleanly.\n")

    # Keep alive until Ctrl+C
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        cleanup()

if __name__ == "__main__":
    main()

