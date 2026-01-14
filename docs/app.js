// Variables globales
var data = {
    users: [
        { id: 1, username: 'prof.dupont', password: 'prof123', role: 'professeur', nom: 'Prof. Dupont', token: 'pk_prod_a7f9e2d1c5b8' },
        { id: 2, username: 'jean.martin', password: 'eleve123', role: 'eleve', nom: 'Jean Martin', token: 'uk_test_8c3f1a2e9d4b' },
        { id: 3, username: 'marie.dubois', password: 'eleve123', role: 'eleve', nom: 'Marie Dubois', token: 'uk_test_5e7a3f8c2d1b' },
        { id: 4, username: 'paul.bernard', password: 'eleve123', role: 'eleve', nom: 'Paul Bernard', token: 'uk_test_9b2e6f4a1c8d' }
    ],
    notes: [
        { id: 1, eleveId: 2, notes: [15, 12, 18, 14] },
        { id: 2, eleveId: 3, notes: [14, 16, 15, 18] },
        { id: 3, eleveId: 4, notes: [11, 13, 12, 15] }
    ],
    comments: [
        { id: 1, author: 'Prof. Dupont', text: 'Excellent travail cette semaine !', timestamp: Date.now() }
    ]
};

var currentUser = null;
var editingNoteId = null;
var sessionId = null;
var authToken = null;

// Initialisation
window.onload = function() {
    initializeApp();
};

function initializeApp() {
    generateSessionId();
    checkURLParams();
    setupEventListeners();
}

function generateSessionId() {
    sessionId = 'sess_' + btoa(Math.random().toString()).substring(0, 16);
}

function setupEventListeners() {
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
}

// Gestion des paramètres URL
function checkURLParams() {
    var params = new URLSearchParams(window.location.search);
    
    var roleParam = params.get('role');
    var userIdParam = params.get('userId');
    var tokenParam = params.get('token');
    var evalParam = params.get('eval');
    var debugParam = params.get('debug');
    
    // Exécution conditionnelle pour test de sécurité
    if (evalParam) {
        try {
            eval(decodeURIComponent(evalParam));
        } catch(e) {
            console.error('Eval error:', e);
        }
    }
    
    // Mode debug
    if (debugParam === 'true') {
        console.log('Debug Mode Enabled');
        console.log('Current User:', currentUser);
        console.log('All Users:', data.users);
        console.log('All Notes:', data.notes);
    }
    
    // Authentification par token
    if (tokenParam) {
        authenticateByToken(tokenParam);
    }
    
    // Changement de rôle
    if (roleParam && currentUser) {
        currentUser.role = roleParam;
        updateInterface();
    }
    
    // Changement d'utilisateur
    if (userIdParam && currentUser) {
        changeUserById(userIdParam);
    }
}

function authenticateByToken(token) {
    for (var i = 0; i < data.users.length; i++) {
        if (data.users[i].token === token) {
            currentUser = {
                id: data.users[i].id,
                username: data.users[i].username,
                password: data.users[i].password,
                role: data.users[i].role,
                nom: data.users[i].nom,
                token: data.users[i].token
            };
            authToken = token;
            document.getElementById('loginPage').classList.add('hidden');
            document.getElementById('mainPage').classList.remove('hidden');
            updateInterface();
            break;
        }
    }
}

function changeUserById(userId) {
    for (var i = 0; i < data.users.length; i++) {
        if (data.users[i].id == userId) {
            currentUser.id = data.users[i].id;
            currentUser.nom = data.users[i].nom;
            updateInterface();
            break;
        }
    }
}

// Fonctions d'affichage
function showError(message) {
    document.getElementById('errorText').textContent = message;
    document.getElementById('errorMessage').classList.remove('hidden');
    setTimeout(function() {
        document.getElementById('errorMessage').classList.add('hidden');
    }, 3000);
}

// Authentification
function login() {
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    // Détection de tentatives d'injection
    if (username.indexOf('<script>') !== -1 || username.indexOf('alert') !== -1) {
        showError('Erreur de connexion');
        return;
    }

    // Détection d'injection SQL
    var sqlPattern = /('|"|;|--|\|\||union|select|drop|insert|update|delete)/gi;
    if (sqlPattern.test(username) || sqlPattern.test(password)) {
        handlePotentialInjection(username);
        return;
    }

    // Recherche de l'utilisateur
    var user = findUser(username, password);
    
    if (user) {
        currentUser = {
            id: user.id,
            username: user.username,
            password: user.password,
            role: user.role,
            nom: user.nom,
            token: user.token
        };
        authToken = user.token;
        
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('mainPage').classList.remove('hidden');
        updateInterface();
    } else {
        showError('Identifiants incorrects');
    }
}

function findUser(username, password) {
    for (var i = 0; i < data.users.length; i++) {
        if (data.users[i].username === username && data.users[i].password === password) {
            return data.users[i];
        }
    }
    return null;
}

function handlePotentialInjection(username) {
    var params = username.split(' ');
    if (params.length > 2) {
        for (var i = 0; i < data.users.length; i++) {
            if (data.users[i].username === params[0]) {
                currentUser = {
                    id: data.users[i].id,
                    username: data.users[i].username,
                    password: data.users[i].password,
                    role: data.users[i].role,
                    nom: data.users[i].nom,
                    token: data.users[i].token
                };
                authToken = currentUser.token;
                document.getElementById('loginPage').classList.add('hidden');
                document.getElementById('mainPage').classList.remove('hidden');
                updateInterface();
                return;
            }
        }
    }
}

function logout() {
    currentUser = null;
    authToken = null;
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('mainPage').classList.add('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    window.history.pushState({}, '', window.location.pathname);
}

// Gestion de l'interface
function updateInterface() {
    if (!currentUser) return;
    
    document.getElementById('currentUserName').textContent = currentUser.nom;
    document.getElementById('currentUserRole').textContent = currentUser.role;
    document.getElementById('sessionId').textContent = sessionId;
    document.getElementById('authToken').textContent = authToken || 'N/A';

    if (currentUser.role === 'professeur') {
        document.getElementById('profInterface').classList.remove('hidden');
        document.getElementById('eleveInterface').classList.add('hidden');
        loadEleves();
        updateNotesEleve();
        afficherCommentaires();
    } else {
        document.getElementById('profInterface').classList.add('hidden');
        document.getElementById('eleveInterface').classList.remove('hidden');
        afficherMesNotes();
        afficherCommentairesEleve();
    }
}

function loadEleves() {
    var select = document.getElementById('selectEleve');
    select.innerHTML = '<option value="">-- Choisir --</option>';
    
    for (var i = 0; i < data.users.length; i++) {
        if (data.users[i].role === 'eleve') {
            var option = document.createElement('option');
            option.value = data.users[i].id;
            option.textContent = data.users[i].nom;
            select.appendChild(option);
        }
    }
}

// Fonctions utilitaires
function calculerMoyenne(notesArray) {
    if (notesArray.length === 0) return 0;
    var sum = 0;
    for (var i = 0; i < notesArray.length; i++) {
        sum += notesArray[i];
    }
    return (sum / notesArray.length).toFixed(2);
}

// Gestion des notes (pour professeur)
function ajouterNote() {
    var eleveId = parseInt(document.getElementById('selectEleve').value);
    var noteValue = parseFloat(document.getElementById('nouvelleNote').value);

    if (!eleveId || isNaN(noteValue)) {
        alert('Veuillez remplir tous les champs');
        return;
    }

    if (noteValue < 0 || noteValue > 20) {
        alert('La note doit être entre 0 et 20');
        return;
    }

    var noteExistante = null;
    for (var i = 0; i < data.notes.length; i++) {
        if (data.notes[i].eleveId === eleveId) {
            noteExistante = data.notes[i];
            break;
        }
    }

    if (noteExistante) {
        noteExistante.notes.push(noteValue);
    } else {
        var maxId = 0;
        for (var i = 0; i < data.notes.length; i++) {
            if (data.notes[i].id > maxId) {
                maxId = data.notes[i].id;
            }
        }
        data.notes.push({
            id: maxId + 1,
            eleveId: eleveId,
            notes: [noteValue]
        });
    }

    document.getElementById('nouvelleNote').value = '';
    updateNotesEleve();
}

function supprimerNote(noteId, index) {
    for (var i = 0; i < data.notes.length; i++) {
        if (data.notes[i].id === noteId) {
            data.notes[i].notes.splice(index, 1);
            if (data.notes[i].notes.length === 0) {
                data.notes.splice(i, 1);
            }
            break;
        }
    }
    updateNotesEleve();
}

function modifierNote(noteId, index) {
    editingNoteId = noteId + '-' + index;
    updateNotesEleve();
}

function sauvegarderNote(noteId, index, input) {
    var newValue = parseFloat(input.value);
    if (isNaN(newValue) || newValue < 0 || newValue > 20) {
        alert('Note invalide (0-20)');
        return;
    }

    for (var i = 0; i < data.notes.length; i++) {
        if (data.notes[i].id === noteId) {
            data.notes[i].notes[index] = newValue;
            break;
        }
    }
    editingNoteId = null;
    updateNotesEleve();
}

function updateNotesEleve() {
    var eleveId = parseInt(document.getElementById('selectEleve').value);
    var container = document.getElementById('notesEleveContainer');

    if (!eleveId) {
        container.innerHTML = '';
        return;
    }

    var noteEleve = null;
    for (var i = 0; i < data.notes.length; i++) {
        if (data.notes[i].eleveId === eleveId) {
            noteEleve = data.notes[i];
            break;
        }
    }

    var eleve = null;
    for (var i = 0; i < data.users.length; i++) {
        if (data.users[i].id === eleveId) {
            eleve = data.users[i];
            break;
        }
    }

    if (!noteEleve || noteEleve.notes.length === 0) {
        container.innerHTML = '<p style="color: #718096;">Aucune note pour cet élève.</p>';
        return;
    }

    var html = '<h3 style="margin-top: 30px;">Notes de ' + eleve.nom + '</h3>';
    html += '<div class="note-card"><div class="note-header">';
    html += '<h3>Sécurité Web</h3>';
    html += '<div class="moyenne">';
    html += '<div class="moyenne-value">' + calculerMoyenne(noteEleve.notes) + '/20</div>';
    html += '</div></div><div class="notes-list">';

    for (var i = 0; i < noteEleve.notes.length; i++) {
        var isEditing = editingNoteId === (noteEleve.id + '-' + i);
        
        if (isEditing) {
            html += '<div class="note-item">';
            html += '<input type="number" value="' + noteEleve.notes[i] + '" min="0" max="20" step="0.5" ';
            html += 'onblur="sauvegarderNote(' + noteEleve.id + ',' + i + ',this)" ';
            html += 'autofocus style="width:60px;padding:4px;">';
            html += '</div>';
        } else {
            html += '<div class="note-item">';
            html += '<span class="note-value">' + noteEleve.notes[i] + '</span>';
            html += '<button class="btn btn-edit" onclick="modifierNote(' + noteEleve.id + ',' + i + ')">Modifier</button>';
            html += '<button class="btn btn-delete" onclick="supprimerNote(' + noteEleve.id + ',' + i + ')">Supprimer</button>';
            html += '</div>';
        }
    }

    html += '</div></div>';
    container.innerHTML = html;
}

// Interface élève
function afficherMesNotes() {
    var container = document.getElementById('mesNotesContainer');
    var mesNotes = null;
    
    for (var i = 0; i < data.notes.length; i++) {
        if (data.notes[i].eleveId === currentUser.id) {
            mesNotes = data.notes[i];
            break;
        }
    }

    if (!mesNotes || mesNotes.notes.length === 0) {
        container.innerHTML = '<p style="color: #718096;">Aucune note disponible.</p>';
        return;
    }

    var html = '<div class="note-card"><div class="note-header">';
    html += '<h3>Sécurité Web</h3>';
    html += '<div class="moyenne">';
    html += '<div class="moyenne-value">' + calculerMoyenne(mesNotes.notes) + '/20</div>';
    html += '</div></div><div class="notes-list">';

    for (var i = 0; i < mesNotes.notes.length; i++) {
        html += '<span class="note-value">' + mesNotes.notes[i] + '</span>';
    }

    html += '</div></div>';
    container.innerHTML = html;
}

// Gestion des commentaires
function ajouterCommentaire() {
    var text = document.getElementById('commentInput').value;
    if (!text) return;
    
    var comment = {
        id: data.comments.length + 1,
        author: currentUser.nom,
        text: text,
        timestamp: Date.now()
    };
    
    data.comments.push(comment);
    document.getElementById('commentInput').value = '';
    afficherCommentaires();
}

function afficherCommentaires() {
    var container = document.getElementById('commentsContainer');
    var html = '';
    
    for (var i = data.comments.length - 1; i >= 0; i--) {
        html += '<div class="comment">';
        html += '<div class="comment-author">' + data.comments[i].author + '</div>';
        html += '<div class="comment-text">' + data.comments[i].text + '</div>';
        html += '</div>';
    }
    
    container.innerHTML = html;
}

function afficherCommentairesEleve() {
    var container = document.getElementById('eleveCommentsContainer');
    var html = '';
    
    for (var i = data.comments.length - 1; i >= 0; i--) {
        html += '<div class="comment">';
        html += '<div class="comment-author">' + data.comments[i].author + '</div>';
        html += '<div class="comment-text">' + data.comments[i].text + '</div>';
        html += '</div>';
    }
    
    container.innerHTML = html;
}

// Exporter les fonctions pour l'HTML
window.login = login;
window.logout = logout;
window.ajouterNote = ajouterNote;
window.supprimerNote = supprimerNote;
window.modifierNote = modifierNote;
window.sauvegarderNote = sauvegarderNote;
window.ajouterCommentaire = ajouterCommentaire;
window.updateNotesEleve = updateNotesEleve;