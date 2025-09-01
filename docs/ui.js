export class UIManager {
    init(app) {
        this.app = app;
        this.bindEvents();
    }
    
    populateCSVSelector(csvFiles) {
        const selector = document.getElementById('csv-selector');
        
        // Garder l'option par défaut
        selector.innerHTML = '<option value="default">Sélectionner un fichier CSV</option>';
        
        // Ajouter les fichiers CSV du dépôt GitHub
        csvFiles.forEach(file => {
            const option = document.createElement('option');
            option.value = file.name;
            option.textContent = file.name;
            option.dataset.downloadUrl = file.download_url;
            option.selected = true; // Sélectionner le premier fichier par défaut
            selector.appendChild(option);
        });
    }
    
    showCardsList(boxNumber, flashcards, reviewIntervals) {
        this.app.currentBoxNumber = boxNumber;
        const boxCards = flashcards.filter(card => card.box === boxNumber);
        const cardsList = document.getElementById('cards-list');
        cardsList.innerHTML = '';
        
        if (boxCards.length === 0) {
            cardsList.innerHTML = '<p class="text-gray-500">Aucune carte</p>';
        } else {
            boxCards.forEach(card => {
                const cardElement = this.createCardElement(card, reviewIntervals);
                cardsList.appendChild(cardElement);
            });
        }
        
        document.getElementById('current-box-number').textContent = boxNumber;
        document.getElementById('cards-list-container').classList.remove('hidden');
        
        // Scroll to the list
        setTimeout(() => {
            document.getElementById('cards-list-container').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100);
    }
    
    createCardElement(card, reviewIntervals) {
        const element = document.createElement('div');
        element.className = 'card-item flex items-start gap-3 p-3 hover:bg-gray-100 rounded-lg cursor-pointer';
        element.dataset.cardId = card.id;
        
        let thumbnailHtml = '';
        if (card.questionImage) {
            thumbnailHtml = `
                <div class="thumbnail-container flex-shrink-0">
                    <img src="${card.questionImage}" 
                         alt="Miniature" 
                         class="thumbnail-image w-12 h-12 object-cover rounded border border-gray-200">
                </div>
            `;
        }
        
        const displayText = card.question || (card.questionImage ? 'Carte avec image' : 'Carte sans texte');
        element.innerHTML = `
            ${thumbnailHtml}
            <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-gray-900 truncate">${displayText}</div>
                <div class="card-next-review text-xs text-gray-500 mt-1">
                    Rev.: ${this.formatTime(card.lastReview + reviewIntervals[card.box - 1] * 3600 * 1000)}
                </div>
            </div>
        `;
        
        element.addEventListener('click', () => {
            this.showCardViewer(card);
        });
        
        return element;
    }
    
    showCardViewer(card) {
        this.app.currentCard = card;
        
        document.getElementById('question-content').innerHTML = '';
        document.getElementById('answer-content').innerHTML = '';
        
        // Afficher la question
        if (card.question) {
            const textElement = document.createElement('div');
            textElement.textContent = card.question;
            document.getElementById('question-content').appendChild(textElement);
        }
        
        if (card.questionImage) {
            const imgElement = document.createElement('img');
            imgElement.src = card.questionImage;
            imgElement.alt = 'Image question';
            imgElement.className = 'mx-auto my-3 max-w-full max-h-[300px] w-auto h-auto object-scale-down';
            document.getElementById('question-content').appendChild(imgElement);
        }
        
        // Préparer la réponse
        if (card.answer) {
            const textElement = document.createElement('div');
            textElement.textContent = card.answer;
            document.getElementById('answer-content').appendChild(textElement);
        }
        
        if (card.answerImage) {
            const imgElement = document.createElement('img');
            imgElement.src = card.answerImage;
            imgElement.alt = 'Image réponse';
            imgElement.className = 'mx-auto my-3 max-w-full max-h-[300px] w-auto h-auto object-scale-down';
            document.getElementById('answer-content').appendChild(imgElement);
        }
        
        document.getElementById('last-reviewed').textContent = 
            `Dernière révision: ${new Date(card.lastReview).toLocaleString('fr-FR')}`;
        
        document.getElementById('answer-section').classList.add('hidden');
        document.getElementById('show-answer-btn').style.display = 'block';
        document.getElementById('flashcard-container').classList.remove('hidden');
    }
    
    hideCardViewer() {
        document.getElementById('flashcard-container').classList.add('hidden');
    }
    
    showCardEditor(card = null) {
        const form = document.getElementById('card-form');
        const title = document.getElementById('editor-title');
        
        if (card) {
            // Mode édition
            title.textContent = 'Modifier la carte';
            document.getElementById('card-id').value = card.id;
            document.getElementById('card-question').value = card.question;
            document.getElementById('card-question-image').value = card.questionImage || '';
            document.getElementById('card-answer').value = card.answer;
            document.getElementById('card-answer-image').value = card.answerImage || '';
            
            // Afficher les prévisualisations d'images
            if (card.questionImage) {
                document.getElementById('question-image-preview').src = card.questionImage;
                document.getElementById('question-image-preview').style.display = 'block';
            }
            if (card.answerImage) {
                document.getElementById('answer-image-preview').src = card.answerImage;
                document.getElementById('answer-image-preview').style.display = 'block';
            }
        } else {
            // Mode création
            title.textContent = 'Nouvelle carte';
            form.reset();
            document.getElementById('card-id').value = '';
            
            // Cacher les prévisualisations d'images
            document.getElementById('question-image-preview').style.display = 'none';
            document.getElementById('answer-image-preview').style.display = 'none';
        }
        
        document.getElementById('card-editor').classList.remove('hidden');
    }
    
    hideCardEditor() {
        document.getElementById('card-editor').classList.add('hidden');
    }
    
    formatTime(timestamp) {
        if (!timestamp) return '';
        
        const now = Date.now();
        const date = new Date(timestamp);
        
        if (timestamp <= now) {
            return 'Maintenant';
        }
        
        const today = new Date();
        if (date.getDate() === today.getDate() && 
            date.getMonth() === today.getMonth() && 
            date.getFullYear() === today.getFullYear()) {
            return date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
        }
        
        return date.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute:'2-digit'
        });
    }
    
    bindEvents() {
        // Fermer la liste des cartes
        document.getElementById('close-cards-list').addEventListener('click', () => {
            document.getElementById('cards-list-container').classList.add('hidden');
        });
        
        // Annuler l'édition
        document.getElementById('cancel-edit').addEventListener('click', () => {
            this.hideCardEditor();
        });
        
        // Bouton voir la réponse
        document.getElementById('show-answer-btn').addEventListener('click', () => {
            document.getElementById('answer-section').classList.remove('hidden');
            document.getElementById('show-answer-btn').style.display = 'none';
        });
        
        // Gestion des réponses
        document.getElementById('wrong-answer').addEventListener('click', () => {
            this.app.processAnswer(false);
        });
        
        document.getElementById('right-answer').addEventListener('click', () => {
            this.app.processAnswer(true);
        });
        
        // Boutons dans le visualisateur de carte
        document.getElementById('edit-card-btn').addEventListener('click', () => {
            this.hideCardViewer();
            this.showCardEditor(this.app.currentCard);
        });
        
        document.getElementById('delete-card-btn').addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir supprimer cette carte?')) {
                this.app.crud.deleteCard(this.app.currentCard.id);
                this.hideCardViewer();
            }
        });
        
        // Sélection d'un fichier CSV
        document.getElementById('csv-selector').addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            if (selectedOption.dataset.downloadUrl) {
                if (confirm(`Voulez-vous charger le fichier ${selectedOption.value} depuis GitHub?`)) {
                    this.app.loadCSVFromURL(selectedOption.dataset.downloadUrl, selectedOption.value);
                }
            }
        });
        
        // Bouton nouvelle carte
        document.getElementById('add-card-btn').addEventListener('click', () => {
            if (this.app.currentCSV === 'default') {
                alert('Veuillez d\'abord sélectionner ou créer un fichier CSV');
                return;
            }
            this.showCardEditor();
        });
        
        // Soumission du formulaire
        document.getElementById('card-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.app.crud.saveCard({
                id: document.getElementById('card-id').value,
                question: document.getElementById('card-question').value,
                questionImage: document.getElementById('card-question-image').value,
                answer: document.getElementById('card-answer').value,
                answerImage: document.getElementById('card-answer-image').value
            });
        });
        
        // Charger un CSV
        document.getElementById('load-csv').addEventListener('click', () => {
            const selectedCSV = document.getElementById('csv-selector').value;
            if (selectedCSV && selectedCSV !== 'default') {
                if (this.app.crud.loadFlashcards(selectedCSV)) {
                    alert(`Fichier "${selectedCSV}" chargé avec ${this.app.flashcards.length} cartes`);
                } else {
                    alert(`Création d'un nouveau fichier "${selectedCSV}"`);
                    this.app.currentCSV = selectedCSV;
                    this.app.flashcards = [];
                    this.app.saveFlashcards();
                }
            } else {
                alert('Veuillez sélectionner un fichier CSV');
            }
        });
        
        // Créer un nouveau CSV
        document.getElementById('create-csv').addEventListener('click', () => {
            document.getElementById('new-csv-form').classList.remove('hidden');
        });
        
        // Sauvegarder un nouveau CSV
        document.getElementById('save-new-csv').addEventListener('click', () => {
            const newName = document.getElementById('new-csv-name').value.trim();
            if (newName) {
                const csvName = newName.endsWith('.csv') ? newName : `${newName}.csv`;
                
                // Ajouter au sélecteur
                const selector = document.getElementById('csv-selector');
                const option = document.createElement('option');
                option.value = csvName;
                option.textContent = csvName;
                selector.appendChild(option);
                selector.value = csvName;
                
                // Sauvegarder la liste
                this.app.crud.saveCSVList();
                
                // Cacher le formulaire
                document.getElementById('new-csv-form').classList.add('hidden');
                document.getElementById('new-csv-name').value = '';
                
                // Charger le nouveau CSV
                this.app.currentCSV = csvName;
                this.app.flashcards = [];
                this.app.saveFlashcards();
                
                alert(`Fichier "${csvName}" créé avec succès!`);
            } else {
                alert('Veuillez entrer un nom valide');
            }
        });
        
        // Exporter en CSV
        document.getElementById('download-csv').addEventListener('click', () => {
            if (this.app.currentCSV === 'default') {
                alert('Veuillez d\'abord sélectionner ou créer un fichier CSV');
                return;
            }
            this.app.crud.exportToCSV();
        });
        
        // Importer un CSV
        document.getElementById('import-csv').addEventListener('click', () => {
            document.getElementById('csv-file').click();
        });
        
        document.getElementById('csv-file').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                // Demander le nom du fichier
                const fileName = prompt('Entrez un nom pour ce fichier CSV:', 
                    e.target.files[0].name.endsWith('.csv') 
                        ? e.target.files[0].name 
                        : `${e.target.files[0].name}.csv`);
                
                if (fileName) {
                    // Ajouter au sélecteur
                    const selector = document.getElementById('csv-selector');
                    const option = document.createElement('option');
                    option.value = fileName;
                    option.textContent = fileName;
                    selector.appendChild(option);
                    selector.value = fileName;
                    
                    // Sauvegarder la liste
                    this.app.crud.saveCSVList();
                    
                    // Importer les données
                    this.app.crud.importFromCSV(e.target.files[0]);
                }
            }
        });
        
        // Gestion des images
        document.getElementById('browse-question-image').addEventListener('click', () => {
            document.getElementById('question-image-upload').click();
        });
        
        document.getElementById('question-image-upload').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    document.getElementById('card-question-image').value = event.target.result;
                    document.getElementById('question-image-preview').src = event.target.result;
                    document.getElementById('question-image-preview').style.display = 'block';
                };
                
                reader.readAsDataURL(file);
            }
        });
        
        document.getElementById('browse-answer-image').addEventListener('click', () => {
            document.getElementById('answer-image-upload').click();
        });
        
        document.getElementById('answer-image-upload').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    document.getElementById('card-answer-image').value = event.target.result;
                    document.getElementById('answer-image-preview').src = event.target.result;
                    document.getElementById('answer-image-preview').style.display = 'block';
                };
                
                reader.readAsDataURL(file);
            }
        });
        
        // Prévisualisation des images via URL
        document.getElementById('card-question-image').addEventListener('blur', (e) => {
            if (e.target.value) {
                document.getElementById('question-image-preview').src = e.target.value;
                document.getElementById('question-image-preview').style.display = 'block';
            } else {
                document.getElementById('question-image-preview').style.display = 'none';
            }
        });
        
        document.getElementById('card-answer-image').addEventListener('blur', (e) => {
            if (e.target.value) {
                document.getElementById('answer-image-preview').src = e.target.value;
                document.getElementById('answer-image-preview').style.display = 'block';
            } else {
                document.getElementById('answer-image-preview').style.display = 'none';
            }
        });
    }
}