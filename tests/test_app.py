import pytest
from app import app as flask_app # Importer notre application

@pytest.fixture
def client():
    """
    Crée un client de test pour notre application Flask.
    C'est une 'fixture' pytest, une fonction spéciale pour préparer les tests.
    """
    with flask_app.test_client() as client:
        yield client

def test_home_route(client):
    """
    Teste la route principale ('/').
    - Vérifie que la réponse a un statut 200 (OK).
    - Vérifie que le contenu JSON est correct.
    """
    # Act: On envoie une requête GET à la route '/'
    response = client.get('/')
    
    # Assert: On vérifie les résultats
    assert response.status_code == 200
    assert response.json == {"message": "Hedwige est prête !"}
