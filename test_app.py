# Ceci est un test très simple pour s'assurer que pytest fonctionne.
# Il vérifie que la route principale ("/") renvoie bien un statut "200 OK".

from app import app

def test_index_route():
    """
    Teste la route d'accueil de l'application.
    """
    client = app.test_client()
    response = client.get('/')
    assert response.status_code == 200
    assert b"Hedwige est pr\u00eate !" in response.data

