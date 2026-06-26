"""Basic backend verification for the local verbal fluency app.

Run from the project root after installing backend dependencies:
    cd backend && PYTHONPATH=. python ../scripts/verify_backend.py
"""

from fastapi.testclient import TestClient
from app.main import app


def main() -> None:
    with TestClient(app) as client:
        health = client.get("/api/health")
        assert health.status_code == 200, health.text

        count_before = client.get("/api/words/count")
        assert count_before.status_code == 200, count_before.text

        empty_drill = client.get("/api/words/drill")
        assert empty_drill.status_code == 200, empty_drill.text
        assert empty_drill.json()["word"] is None
        assert empty_drill.json()["message"] == "No words to show."

        exists_before = client.get("/api/words/exists?word=lucid")
        assert exists_before.status_code == 200, exists_before.text
        assert exists_before.json()["exists"] is False

        first = client.post(
            "/api/words",
            json={
                "word": "lucid",
                "part_of_speech": "Adjective",
                "definition": "Clear and easy to understand.",
                "example_sentence": "Her explanation was lucid and reassuring.",
            },
        )
        assert first.status_code == 201, first.text
        first_word = first.json()
        assert first_word["part_of_speech"] == "Adjective"
        assert first_word["example_sentence"]

        exists_after = client.get("/api/words/exists?word=  LUCID  ")
        assert exists_after.status_code == 200, exists_after.text
        assert exists_after.json()["exists"] is True

        duplicate = client.post(
            "/api/words",
            json={
                "word": "Lucid",
                "part_of_speech": "Adjective",
                "definition": "A duplicate with different capitalization.",
                "example_sentence": "",
            },
        )
        assert duplicate.status_code == 409, duplicate.text

        second = client.post(
            "/api/words",
            json={
                "word": "temper",
                "part_of_speech": "Verb",
                "definition": "To soften, moderate, or balance something.",
                "example_sentence": "",
            },
        )
        assert second.status_code == 201, second.text
        second_word = second.json()
        assert second_word["example_sentence"] is None

        count_after = client.get("/api/words/count")
        assert count_after.status_code == 200, count_after.text
        assert count_after.json()["count"] >= 2

        drill = client.get("/api/words/drill")
        assert drill.status_code == 200, drill.text
        drill_word = drill.json()["word"]
        assert drill_word is not None
        assert drill_word["shown_count"] >= 1

        next_drill = client.get(f"/api/words/drill?exclude_id={drill_word['id']}")
        assert next_drill.status_code == 200, next_drill.text
        next_word = next_drill.json()["word"]
        assert next_word is not None
        if count_after.json()["count"] > 1:
            assert next_word["id"] != drill_word["id"]

        delete = client.delete(f"/api/words/{first_word['id']}")
        assert delete.status_code == 204, delete.text

        delete_second = client.delete(f"/api/words/{second_word['id']}")
        assert delete_second.status_code == 204, delete_second.text

    print("Backend verification passed.")


if __name__ == "__main__":
    main()
