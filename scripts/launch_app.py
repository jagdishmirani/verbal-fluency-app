"""Start the local verbal fluency app.

This small launcher starts the FastAPI backend, starts the Next.js frontend,
waits for both to respond, and then opens the app in your default browser.
It is intended as the local v1 "agent" for Windows everyday use.
"""

from __future__ import annotations

import os
import platform
import subprocess
import sys
import time
import urllib.error
import urllib.request
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
BACKEND_URL = "http://127.0.0.1:8000/api/health"
FRONTEND_URL = "http://127.0.0.1:3001"


def wait_for_url(url: str, label: str, timeout_seconds: int = 45) -> bool:
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                if response.status < 500:
                    return True
        except (urllib.error.URLError, TimeoutError, OSError):
            time.sleep(1)
    print(f"Warning: {label} did not respond at {url} within {timeout_seconds} seconds.")
    return False


def windows_command(command: str, cwd: Path) -> None:
    subprocess.Popen(
        ["cmd.exe", "/k", command],
        cwd=str(cwd),
        creationflags=subprocess.CREATE_NEW_CONSOLE,  # type: ignore[attr-defined]
    )


def unix_command(command: str, cwd: Path) -> subprocess.Popen[str]:
    return subprocess.Popen(command, cwd=str(cwd), shell=True, text=True)


def main() -> int:
    if not BACKEND.exists() or not FRONTEND.exists():
        print("Could not find backend and frontend folders. Run this from the project you extracted.")
        return 1

    system = platform.system().lower()

    print("Starting Verbal Fluency App...")
    print(f"Project folder: {ROOT}")

    if system == "windows":
        venv_python = BACKEND / ".venv" / "Scripts" / "python.exe"
        if not venv_python.exists():
            print(f"Missing backend virtual environment: {venv_python}")
            print("Run the first-time backend setup steps in the README, then try again.")
            return 1

        subprocess.Popen(
            [
                str(venv_python),
                "-m",
                "uvicorn",
                "app.main:app",
                "--reload",
                "--host",
                "127.0.0.1",
                "--port",
                "8000",
            ],
            cwd=str(BACKEND),
            creationflags=subprocess.CREATE_NEW_CONSOLE,  # type: ignore[attr-defined]
        )

        frontend_cmd = "npm run dev -- -H 127.0.0.1 -p 3001"
        windows_command(frontend_cmd, FRONTEND)
    else:
        venv_python = BACKEND / ".venv" / "bin" / "python"
        python_cmd = str(venv_python) if venv_python.exists() else sys.executable
        unix_command(f'"{python_cmd}" -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000', BACKEND)
        unix_command("npm run dev -- -H 127.0.0.1 -p 3001", FRONTEND)

    backend_ok = wait_for_url(BACKEND_URL, "Backend")
    frontend_ok = wait_for_url(FRONTEND_URL, "Frontend")

    if backend_ok and frontend_ok:
        print(f"Opening {FRONTEND_URL}")
        webbrowser.open_new_tab(FRONTEND_URL)
        print("The app is running. Keep the backend and frontend terminal windows open while using it.")
        return 0

    print("The launcher started the processes, but one service did not respond.")
    print("Check the backend and frontend terminal windows for errors.")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
