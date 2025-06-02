// --- js/admin.js ---
document.addEventListener('DOMContentLoaded', async () => {
    // Autenticação
    if (!AlimentaAIDataService.isAdminLoggedIn()) {
        window.location.href = 'index.html';
        return;
    }

    // Elementos do DOM Globais
    const adminNamePlaceholder = document.getElementById('adminNamePlaceholder');
    const activePatientsCount = document.getElementById('activePatientsCount'); // Referência ao h5 do card
    const patientsTableBody = document.getElementById('patientsTableBody');
    
    // Modal Adicionar Paciente
    const addPatientForm = document.getElementById('addPatientForm');
    const addPatientModalEl = document.getElementById('addPatientModal');
    const addPatientModal = bootstrap.Modal.getOrCreateInstance(addPatientModalEl);
    const addPatientErrorAlert = document.getElementById('addPatientErrorAlert');
    const patientNameInput = document.getElementById('patientName');
    const patientEmailInput = document.getElementById('patientEmail');
    const patientPhoneInput = document.getElementById('patientPhone');
    const patientPasswordInput = document.getElementById('patientPassword');

    // Modal Editar Paciente
    const editPatientModalEl = document.getElementById('editPatientModal');
    const editPatientModal = bootstrap.Modal.getOrCreateInstance(editPatientModalEl);
    const editPatientForm = document.getElementById('editPatientForm');
    const editPatientIdInput = document.getElementById('editPatientId');
    const editPatientNameInput = document.getElementById('editPatientName');
    const editPatientEmailInput = document.getElementById('editPatientEmail');
    const editPatientPhoneInput = document.getElementById('editPatientPhone');
    const editPatientErrorAlert = document.getElementById('editPatientErrorAlert');

    // Modal Alterar Senha
    const changePasswordModalEl = document.getElementById('changePasswordModal');
    const changePasswordModal = bootstrap.Modal.getOrCreateInstance(changePasswordModalEl);
    const changePasswordForm = document.getElementById('changePasswordForm');
    const patientEmailForPasswordChangeText = document.getElementById('patientEmailForPasswordChangeText'); // Corrigido para corresponder ao HTML que usa patientEmailForPasswordChangeText
    const changePasswordPatientEmailInput = document.getElementById('changePasswordPatientEmail');
    const changePasswordPatientIdInput = document.getElementById('changePasswordPatientId'); // ADICIONAR ESTA LINHA
    const newPasswordInput = document.getElementById('newPassword');
    const changePasswordErrorAlert = document.getElementById('changePasswordErrorAlert');

    // Modal de Confirmação
    const confirmationModalEl = document.getElementById('confirmationModal');
    const confirmationModal = bootstrap.Modal.getOrCreateInstance(confirmationModalEl);
    const confirmationModalLabel = document.getElementById('confirmationModalLabel');
    const confirmationModalMessage = document.getElementById('confirmationModalMessage');
    const confirmationModalConfirmBtn = document.getElementById('confirmationModalConfirmBtn');

    // --- Aba Definir Macros ---
    const selectPatientForMacros = document.getElementById('selectPatientForMacros');
    const setMacrosForm = document.getElementById('setMacrosForm');
    const macroCaloriesInput = document.getElementById('macroCalories');
    const macroProteinsInput = document.getElementById('macroProteins');
    const macroCarbsInput = document.getElementById('macroCarbs');
    const macroFatsInput = document.getElementById('macroFats');
    const clearMacrosFormBtn = document.getElementById('clearMacrosFormBtn');

    // --- Aba Alimentos Consumidos ---
    const selectPatientForFoods = document.getElementById('selectPatientForFoods');
    const foodsDate = document.getElementById('foodsDate');
    const loadFoodsBtn = document.getElementById('loadFoodsBtn');
    const foodsTableBody = document.getElementById('foodsTableBody');
    const foodsSummary = document.getElementById('foodsSummary');
    const totalCalories = document.getElementById('totalCalories');
    const totalProteins = document.getElementById('totalProteins');
    const totalCarbs = document.getElementById('totalCarbs');
    const totalFats = document.getElementById('totalFats');

    // --- Toast para Notificações ---
    const toastEl = document.getElementById('liveToast');
    const toastTitleEl = document.getElementById('toastTitle');
    const toastBodyEl = document.getElementById('toastBody');
    const toast = bootstrap.Toast.getOrCreateInstance(toastEl);

    let currentConfirmCallback = null;

    await initializeAdminPanel();

    async function initializeAdminPanel() {
        displayAdminInfo();
        await loadAndDisplayPatients(); 
        setupEventListeners();
        setupFoodsTab(); // Nova função para configurar a aba de alimentos
    }

    function displayAdminInfo() {
        const adminInfo = AlimentaAIDataService.getLoggedInAdminInfo();
        if (adminInfo && adminNamePlaceholder) {
            adminNamePlaceholder.textContent = adminInfo.email;
        }
    }

    function setupEventListeners() {
        const adminLogoutBtn = document.getElementById('adminLogoutBtn');
        if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', handleAdminLogout);
        
        if (addPatientForm) addPatientForm.addEventListener('submit', handleAddPatientSubmit);
        if (editPatientForm) editPatientForm.addEventListener('submit', handleEditPatientSubmit);
        
        if (editPatientModalEl) {            editPatientModalEl.addEventListener('show.bs.modal', async (event) => {
                const button = event.relatedTarget;
                const patientId = button.getAttribute('data-patient-id');
                console.log('🔧 Editando paciente - ID recebido:', patientId, typeof patientId);
                
                if (patientId) {
                    try {
                        const patient = await AlimentaAIDataService.getPatientById(patientId);
                        console.log('👤 Dados do paciente carregados:', patient);
                        
                        if (patient) {
                            editPatientIdInput.value = patient.id;
                            editPatientNameInput.value = patient.name || '';
                            editPatientEmailInput.value = patient.email || '';
                            editPatientPhoneInput.value = patient.phone || '';
                            formatPhoneNumberOnLoad(editPatientPhoneInput);
                        } else {
                            console.error('❌ Paciente não encontrado para ID:', patientId);
                            showToast('Erro', 'Não foi possível carregar dados do paciente.', 'danger');
                            editPatientModal.hide();
                        }
                    } catch (error) {
                        console.error('❌ Erro ao carregar paciente:', error);
                        showToast('Erro', 'Erro ao carregar dados do paciente.', 'danger');
                        editPatientModal.hide();
                    }
                } else {
                    console.error('❌ ID do paciente não fornecido');
                    showToast('Erro', 'ID do paciente não encontrado.', 'danger');
                    editPatientModal.hide();
                }
                hideEditPatientError();
            });
        }
        
        if (changePasswordForm) changePasswordForm.addEventListener('submit', handleChangePasswordSubmit);
        if (changePasswordModalEl) {
            changePasswordModalEl.addEventListener('show.bs.modal', async (event) => {
                const button = event.relatedTarget;
                const patientId = button.getAttribute('data-patient-id');
                let displayEmail = button.getAttribute('data-patient-email');
                if (patientId) {
                    const patient = await AlimentaAIDataService.getPatientById(patientId);
                    if(patient && patient.email) displayEmail = patient.email;
                }
                if(patientEmailForPasswordChangeText) patientEmailForPasswordChangeText.textContent = displayEmail; // Verifica se o elemento existe
                changePasswordPatientEmailInput.value = displayEmail;
                newPasswordInput.value = '';
                hideChangePasswordError();
            });
        }
        
        if (setMacrosForm) setMacrosForm.addEventListener('submit', handleSetMacrosSubmit);
        if (selectPatientForMacros) selectPatientForMacros.addEventListener('change', handlePatientSelectionForMacros);
        if (clearMacrosFormBtn) clearMacrosFormBtn.addEventListener('click', clearMacrosForm);

        // Novos event listeners para a aba de alimentos
        if (loadFoodsBtn) loadFoodsBtn.addEventListener('click', handleLoadFoods);
        if (selectPatientForFoods) selectPatientForFoods.addEventListener('change', handlePatientSelectionForFoods);

        if (confirmationModalConfirmBtn) {
            confirmationModalConfirmBtn.addEventListener('click', () => {
                if (typeof currentConfirmCallback === 'function') {
                    currentConfirmCallback();
                }
                currentConfirmCallback = null; 
            });
        }
        if (confirmationModalEl) {
            confirmationModalEl.addEventListener('hidden.bs.modal', () => {
                currentConfirmCallback = null; 
                confirmationModalConfirmBtn.className = 'btn btn-danger'; 
                confirmationModalConfirmBtn.textContent = 'Confirmar';
            });
        }

        if (patientPhoneInput) patientPhoneInput.addEventListener('input', handlePhoneInputFormattingEvent);
        if (editPatientPhoneInput) editPatientPhoneInput.addEventListener('input', handlePhoneInputFormattingEvent);
    }

    function showConfirmationModal(title, message, confirmCallback, confirmButtonClass = 'btn-danger', confirmButtonText = 'Confirmar') {
        if (confirmationModalLabel) confirmationModalLabel.textContent = title;
        if (confirmationModalMessage) confirmationModalMessage.innerHTML = message;
        currentConfirmCallback = confirmCallback;
        if (confirmationModalConfirmBtn) {
            confirmationModalConfirmBtn.className = 'btn';
            confirmationModalConfirmBtn.classList.add(confirmButtonClass);
            confirmationModalConfirmBtn.textContent = confirmButtonText;
        }
        confirmationModal.show();
    }
    
    function formatPhoneNumber(digits) {
        if (!digits) return '';
        const len = digits.length;
        if (len === 0) return '';
        if (len === 1) return `(${digits}`;                            
        if (len === 2) return `(${digits})`;                            
        if (len >= 3 && len <= 7) return `(${digits.substring(0, 2)}) ${digits.substring(2, len)}`; 
        return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7, 11)}`; 
    }

    function handlePhoneInputFormattingEvent(event) {
        const input = event.target;
        let digits = input.value.replace(/\D/g, '');
        digits = digits.substring(0, 11); 
        const formattedValue = formatPhoneNumber(digits);
        input.value = formattedValue;
        let finalCursorPos = 0;
        const numDigits = digits.length;
             if (numDigits === 0) finalCursorPos = 0;
        else if (numDigits === 1) finalCursorPos = 2; 
        else if (numDigits === 2) finalCursorPos = 3; 
        else if (numDigits >= 3 && numDigits <=7) finalCursorPos = 3 + 1 + (numDigits - 2);
        else if (numDigits >= 8 && numDigits <=11)finalCursorPos = 3 + 1 + 5 + 1 + (numDigits - 7); 
        finalCursorPos = Math.min(finalCursorPos, formattedValue.length);
        setTimeout(() => {
            try { input.setSelectionRange(finalCursorPos, finalCursorPos); } 
            catch (e) { /* ignore */ }
        }, 0);
    }

    function formatPhoneNumberOnLoad(inputElement) {
        if (inputElement && inputElement.value) {
            inputElement.value = formatPhoneNumber(inputElement.value.replace(/\D/g, ''));
        }
    }

    async function loadAndDisplayPatients() {        showSpinnerLoading('patientsTableBody', true, 6);
        try {
            const result = await AlimentaAIDataService.getPatients();
            console.log("loadAndDisplayPatients - Resultado recebido:", result); // DEBUG
            
            if (result.success && result.patients) {
                const patients = result.patients;
                renderPatientsTable(patients); 
                populatePatientSelect(patients); 
                await updateDashboardStats(patients.length);
                showToast('Sucesso', `${patients.length} paciente(s) carregado(s)`, 'success');
            } else {
                console.error("Erro ao carregar pacientes:", result.message);
                showToast('Aviso', result.message || 'Nenhum paciente encontrado', 'warning');
                renderPatientsTable([]); 
                populatePatientSelect([]); 
                await updateDashboardStats(0);
            }
        } catch (error) {
            console.error("Erro Crítico ao carregar pacientes:", error);
            showToast('Erro Crítico', 'Não foi possível carregar dados. Verifique o console.', 'danger');
            renderPatientsTable([]); populatePatientSelect([]); await updateDashboardStats(0);
        } finally {
            showSpinnerLoading('patientsTableBody', false);
        }
    }

    function renderPatientsTable(patients) {
        if (!patientsTableBody) { console.error("Elemento patientsTableBody não encontrado!"); return; }
        patientsTableBody.innerHTML = '';
        if (!patients || patients.length === 0) {
            patientsTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Nenhum paciente cadastrado.</td></tr>`;
            return;
        }
        patients.forEach((patient, index) => {
            const row = patientsTableBody.insertRow();
            const statusText = patient.status === 'active' ? 'Ativo' : 'Inativo';
            const statusClass = patient.status === 'active' ? 'badge bg-success' : 'badge bg-secondary';
            const toggleButtonText = patient.status === 'active' ? 'Desativar' : 'Ativar';
            const toggleButtonClass = patient.status === 'active' ? 'btn-outline-danger' : 'btn-outline-success';
            const toggleButtonIcon = patient.status === 'active' ? 'bi-toggle-off' : 'bi-toggle-on';
            row.innerHTML = `
                <th scope="row">${index + 1}</th>
                <td>${patient.name || 'N/A'}</td>
                <td>${patient.email}</td>
                <td>${patient.phone ? formatPhoneNumber(patient.phone.replace(/\D/g, '')) : 'N/A'}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-info me-1 mb-1 btn-edit-patient"
                            data-bs-toggle="modal" data-bs-target="#editPatientModal"
                            data-patient-id="${patient.id}" title="Editar Dados">
                        <i class="bi bi-pencil-fill"></i> <span class="d-none d-md-inline">Editar</span>
                    </button>
                    <button class="btn btn-sm ${toggleButtonClass} me-1 mb-1 btn-toggle-status" 
                            data-patient-id="${patient.id}" data-patient-name="${patient.name || patient.email}"
                            data-current-status="${patient.status}" title="${toggleButtonText} Paciente">
                        <i class="bi ${toggleButtonIcon}"></i> <span class="d-none d-md-inline">${toggleButtonText}</span>
                    </button>
                    <button class="btn btn-sm btn-warning me-1 mb-1 btn-change-password" 
                            data-bs-toggle="modal" data-bs-target="#changePasswordModal"
                            data-patient-id="${patient.id}" data-patient-email="${patient.email}"
                            title="Alterar Senha">
                        <i class="bi bi-key-fill"></i>
                    </button>
                    <button class="btn btn-sm btn-danger mb-1 btn-remove-patient" 
                            data-patient-id="${patient.id}" data-patient-name="${patient.name || patient.email}"
                            title="Remover Paciente">
                        <i class="bi bi-trash-fill"></i>
                    </button>
                </td>`;
        });
        document.querySelectorAll('.btn-remove-patient').forEach(button => {
            button.addEventListener('click', (event) => {
                const patientId = event.currentTarget.getAttribute('data-patient-id');
                const patientName = event.currentTarget.getAttribute('data-patient-name');
                handleRemovePatient(patientId, patientName);
            });
        });
        document.querySelectorAll('.btn-toggle-status').forEach(button => {
            button.addEventListener('click', (event) => {
                const patientId = event.currentTarget.getAttribute('data-patient-id');
                const patientName = event.currentTarget.getAttribute('data-patient-name');
                const currentStatus = event.currentTarget.getAttribute('data-current-status');
                handleTogglePatientStatus(patientId, currentStatus, patientName);
            });
        });
    }
    
    // ***** FUNÇÃO CENTRAL PARA CORRIGIR O CONTADOR DO DASHBOARD *****
    async function updateDashboardStats(count = null) {
        // console.log(`updateDashboardStats chamada com count: ${count}`); // DEBUG
        if (!activePatientsCount) {
            console.error("Elemento 'activePatientsCount' (para o contador do dashboard) não foi encontrado no DOM.");
            return;
        }

        let finalCount = 0;
        if (count !== null && typeof count === 'number') {
            finalCount = count;
            // console.log(`Dashboard count (direto): ${finalCount}`); // DEBUG
        } else {
            // console.log("Buscando contagem de pacientes para o dashboard..."); // DEBUG
            try {
                // Esta linha estava buscando de `AlimentaAIDataService.getPatients()` que retorna {success, patients},
                // precisamos acessar o array `patients` e então seu `length`.
                const result = await AlimentaAIDataService.getPatients();
                if (result.success && Array.isArray(result.patients)) {
                    finalCount = result.patients.length;
                } else {
                    finalCount = 0;
                }
                // console.log(`Dashboard count (buscado): ${finalCount}, pacientes:`, result.patients); // DEBUG
            } catch (error) {
                console.error("Erro ao buscar pacientes para atualizar estatísticas do dashboard:", error);
                finalCount = 0; // Define como 0 em caso de erro
            }
        }
        activePatientsCount.textContent = finalCount.toString();
    }

    async function handleAddPatientSubmit(event) {
        event.preventDefault();
        hideAddPatientError();
        const patientData = {
            name: patientNameInput.value.trim(),
            email: patientEmailInput.value.trim(),
            phone: patientPhoneInput.value.replace(/\D/g, ''),
            password: patientPasswordInput.value.trim()
        };
        if (!patientData.name || !patientData.email || !patientData.password) {
            showAddPatientError("Nome, email e senha são obrigatórios."); return;
        }
        const submitButton = addPatientForm.querySelector('button[type="submit"]');
        setButtonLoading(submitButton, true, 'Adicionando...');
        try {
            const result = await AlimentaAIDataService.addPatient(patientData);
            if (result && result.success) {
                showToast('Sucesso', `Paciente ${patientData.name} adicionado!`, 'success');
                addPatientForm.reset(); addPatientModal.hide();
                await loadAndDisplayPatients(); // Esta chamada irá atualizar a tabela e o dashboard
            } else { 
                showAddPatientError(result ? result.message : 'Erro desconhecido ao adicionar.');
            }
        } catch (error) { console.error("Catch em handleAddPatientSubmit:", error); showAddPatientError('Falha na comunicação ao adicionar.');
        } finally { setButtonLoading(submitButton, false, 'Adicionar Paciente');}
    }
      async function handleEditPatientSubmit(event) {
        event.preventDefault();
        hideEditPatientError();
        
        const patientId = editPatientIdInput.value;
        const updatedData = {
            name: editPatientNameInput.value.trim(),
            email: editPatientEmailInput.value.trim(),
            phone: editPatientPhoneInput.value.replace(/\D/g, '')
        };
        
        console.log('📝 Dados para edição:', { patientId, updatedData });
        
        if (!updatedData.name || !updatedData.email) {
            showEditPatientError("Nome e email são obrigatórios."); 
            return;
        }
        
        const submitButton = editPatientForm.querySelector('button[type="submit"]');
        setButtonLoading(submitButton, true, 'Salvando...');
          try {
            const result = await AlimentaAIDataService.updatePatientDetails(patientId, updatedData);
            console.log('📊 Resultado da edição:', result);
              // Verificar se foi bem-sucedido (success: true OU status: true)
            if (result && (result.success || result.status)) {
                console.log('✅ Edição bem-sucedida, fechando modal e recarregando lista');
                showToast('Sucesso', `Dados de ${updatedData.name} atualizados!`, 'success');
                
                // Fechar modal
                try {
                    editPatientModal.hide();
                    console.log('✅ Modal de edição fechado com sucesso');
                } catch (modalError) {
                    console.error('❌ Erro ao fechar modal:', modalError);
                }
                
                // Recarregar lista de pacientes
                try {
                    await loadAndDisplayPatients();
                    console.log('✅ Lista de pacientes recarregada com sucesso');
                } catch (loadError) {
                    console.error('❌ Erro ao recarregar lista:', loadError);
                }
            } else { 
                const errorMsg = result ? result.message : 'Erro ao atualizar.';
                console.error('❌ Erro na edição:', errorMsg);
                showEditPatientError(errorMsg);
            }
        } catch (error) { 
            console.error('❌ Erro na requisição:', error); 
            showEditPatientError('Falha no servidor.');
        } finally { 
            setButtonLoading(submitButton, false, 'Salvar Alterações');
        }
    }

    async function handleRemovePatient(patientId, patientName) {
        showConfirmationModal('Confirmar Remoção', `Tem certeza que deseja remover <strong>${patientName}</strong>?`,
            async () => {
                try {
                    const result = await AlimentaAIDataService.removePatient(patientId);
                    if (result && result.success) {
                        showToast('Sucesso', `Paciente ${patientName} removido!`, 'success');
                        await loadAndDisplayPatients(); // Atualiza tabela e dashboard
                    } else { showToast('Erro', result ? result.message : 'Não foi possível remover.', 'danger');}
                } catch (error) { console.error(error); showToast('Erro', 'Falha no servidor.', 'danger');}
                finally { confirmationModal.hide(); }
            }, 'btn-danger', 'Sim, Remover');
    }    async function handleChangePasswordSubmit(event) {
        event.preventDefault(); 
        hideChangePasswordError();
        
        const patientEmail = changePasswordPatientEmailInput.value; 
        const newPass = newPasswordInput.value;
        
        if (!newPass || newPass.length < 6) { 
            showChangePasswordError("Senha deve ter ao menos 6 caracteres."); 
            return; 
        }
        
        const btn = changePasswordForm.querySelector('button[type="submit"]'); 
        setButtonLoading(btn, true, 'Salvando...');
        
        try {
            const result = await AlimentaAIDataService.updatePatientPassword(patientEmail, newPass);
            console.log('📊 Resultado da alteração de senha:', result);
            
            // Verificar se foi bem-sucedido (success: true OU status: true)
            if (result && (result.success || result.status)) {
                console.log('✅ Alteração de senha bem-sucedida, fechando modal');
                showToast('Sucesso', `Senha de ${patientEmail} alterada!`, 'success'); 
                
                // Fechar modal
                try {
                    changePasswordModal.hide();
                    console.log('✅ Modal de alteração de senha fechado com sucesso');
                } catch (modalError) {
                    console.error('❌ Erro ao fechar modal de senha:', modalError);
                }
            } else { 
                const errorMsg = result ? result.message : 'Não foi possível alterar.';
                console.error('❌ Erro na alteração de senha:', errorMsg);
                showChangePasswordError(errorMsg);
            }
        } catch (e) { 
            console.error('❌ Erro na requisição de alteração de senha:', e); 
            showChangePasswordError('Falha no servidor.');
        } finally { 
            setButtonLoading(btn, false, 'Salvar Nova Senha'); 
        }
    }

    async function handleTogglePatientStatus(patientId, currentStatus, patientName) {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const actionText = newStatus === 'active' ? 'ATIVAR' : 'DESATIVAR';
        showConfirmationModal(`Confirmar Status`, `Deseja <strong>${actionText}</strong> o paciente <strong>${patientName}</strong>?`,
            async () => {
                try {
                    const result = await AlimentaAIDataService.setPatientStatus(patientId, newStatus); 
                    if (result && result.success) { 
                        showToast('Sucesso', result.message || `Status alterado!`, 'success'); 
                        await loadAndDisplayPatients(); // Atualiza tabela e dashboard
                    } else { 
                        showToast('Erro', result ? result.message : 'Não foi possível alterar.', 'danger');
                    }
                } catch (e) { console.error(e); showToast('Erro', 'Falha no servidor.', 'danger');}
                finally { confirmationModal.hide(); }
            }, newStatus === 'active' ? 'btn-success' : 'btn-warning', `Sim, ${actionText}`);
    }
    
    function setupFoodsTab() {
        // Definir data de hoje como padrão
        if (foodsDate) {
            foodsDate.value = new Date().toISOString().split('T')[0];
        }
    }

    function populatePatientSelect(patients) {
        if (!Array.isArray(patients)) { console.error("populatePatientSelect: patients não é array"); return; }
        
        // Limpar e popular select de macros
        if (selectPatientForMacros) {
            selectPatientForMacros.innerHTML = '<option value="" selected disabled>-- Escolha um paciente --</option>';
            patients.filter(p => p.status === 'active').forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = `${patient.name} (${patient.email})`;
                selectPatientForMacros.appendChild(option);
            });
        }

        // Limpar e popular select de alimentos
        if (selectPatientForFoods) {
            selectPatientForFoods.innerHTML = '<option value="" selected disabled>-- Escolha um paciente --</option>';
            patients.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = `${patient.name} (${patient.email})`;
                selectPatientForFoods.appendChild(option);
            });
        }
    }

    function handlePatientSelectionForFoods() {
        // Limpar tabela quando mudar paciente
        if (foodsTableBody) {
            foodsTableBody.innerHTML = '<tr><td colspan="8" class="text-center">Clique em "Buscar" para carregar os alimentos</td></tr>';
        }
        if (foodsSummary) {
            foodsSummary.style.display = 'none';
        }
    }    
    
    async function handleLoadFoods() {
        const patientId = selectPatientForFoods?.value;
        const date = foodsDate?.value;

        console.log('🔍 handleLoadFoods chamada:', {
            patientId,
            patientIdType: typeof patientId,
            date,
            dateType: typeof date,
            selectElement: selectPatientForFoods ? 'PRESENTE' : 'AUSENTE',
            dateElement: foodsDate ? 'PRESENTE' : 'AUSENTE'
        });

        if (!patientId) {
            console.log('❌ Nenhum paciente selecionado');
            showToast('Aviso', 'Por favor, selecione um paciente', 'warning');
            return;
        }

        if (!date) {
            console.log('❌ Nenhuma data selecionada');
            showToast('Aviso', 'Por favor, selecione uma data', 'warning');
            return;
        }

        try {
            if (!AlimentaAIDataService.isAdminLoggedIn()) {
                console.log('❌ Admin não está logado');
                showToast('Erro', 'Sessão expirada. Por favor, faça login novamente.', 'danger');
                window.location.href = 'index.html';
                return;
            }

            // Mostrar loading
            if (foodsTableBody) {
                foodsTableBody.innerHTML = '<tr><td colspan="8" class="text-center"><div class="spinner-border spinner-border-sm me-2"></div>Carregando alimentos...</td></tr>';
            }

            console.log('📞 Chamando AlimentaAIDataService.getPatientFoods...');
            const result = await AlimentaAIDataService.getPatientFoods(patientId, date);
            
            // --- INÍCIO DO CÓDIGO DE DEBUG ADICIONADO ---
            console.log('ADMIN.JS: Result from getPatientFoods:', JSON.stringify(result, null, 2)); 
            if (result && result.foods) {
                console.log('ADMIN.JS: result.success:', result.success);
                console.log('ADMIN.JS: result.foods is an array:', Array.isArray(result.foods));
                console.log('ADMIN.JS: result.foods length:', result.foods.length);
            }
            // --- FIM DO CÓDIGO DE DEBUG ADICIONADO ---

            if (result.success && Array.isArray(result.foods) && result.foods.length > 0) {
                // --- INÍCIO DO CÓDIGO DE DEBUG ADICIONADO ---
                console.log('ADMIN.JS: Condition to render is TRUE. Foods to render:', result.foods);
                // --- FIM DO CÓDIGO DE DEBUG ADICIONADO ---
                console.log('✅ Alimentos encontrados, renderizando tabela...');
                renderFoodsTable(result.foods);
                updateFoodsSummary(result.totals);
                showToast('Sucesso', `${result.foods.length} alimento(s) encontrado(s)`, 'success');
            } else {
                // --- INÍCIO DO CÓDIGO DE DEBUG ADICIONADO ---
                console.log('ADMIN.JS: Condition to render is FALSE. Full result:', JSON.stringify(result, null, 2));
                // --- FIM DO CÓDIGO DE DEBUG ADICIONADO ---
                console.log('⚠️ Nenhum alimento encontrado ou erro:', result);
                if (foodsTableBody) { 
                    foodsTableBody.innerHTML = '<tr><td colspan="8" class="text-center">Nenhum alimento encontrado ou erro ao carregar.</td></tr>';
                }
                if (foodsSummary) { 
                    foodsSummary.style.display = 'none';
                }
                showToast('Informação', result.message || 'Nenhum alimento encontrado ou erro ao carregar.', 'info');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar alimentos:', error);
            if (foodsTableBody) {
                foodsTableBody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Erro ao carregar alimentos</td></tr>';
            }
            showToast('Erro', 'Erro ao carregar alimentos. Por favor, tente novamente.', 'danger');
        }
    }    
    
    function renderFoodsTable(foods) {
        console.log('🖌️ renderFoodsTable chamado com:', foods);
        if (!foodsTableBody) {
            console.error('❌ foodsTableBody não encontrado no DOM');
            return;
        }

        try {
            console.log('🧹 Limpando tabela');
            foodsTableBody.innerHTML = '';
            
            console.log('📊 Renderizando', foods.length, 'alimentos');
            foods.forEach((food, index) => {
                const row = foodsTableBody.insertRow();
                row.innerHTML = `
                    <td><span class="badge bg-secondary">${food.refeicao}</span></td>
                    <td>${food.nome}</td>
                    <td>${food.quantidade}</td>
                    <td>${food.calorias} kcal</td>
                    <td>${food.proteinas}g</td>
                    <td>${food.carboidratos}g</td>
                    <td>${food.gorduras}g</td>
                    <td>${food.horario}</td>
                `;
            });
            console.log('✅ Tabela renderizada com sucesso');
        } catch (error) {
            console.error('❌ Erro ao renderizar tabela:', error);
        }
    }    
    
    function updateFoodsSummary(totals) {
        console.log('📊 updateFoodsSummary chamada com:', totals);
        
        try {
            if (!totalCalories || !totalProteins || !totalCarbs || !totalFats) {
                console.warn('⚠️ Alguns elementos de resumo não foram encontrados:');
                console.log('totalCalories:', totalCalories ? 'OK' : 'AUSENTE');
                console.log('totalProteins:', totalProteins ? 'OK' : 'AUSENTE');
                console.log('totalCarbs:', totalCarbs ? 'OK' : 'AUSENTE');
                console.log('totalFats:', totalFats ? 'OK' : 'AUSENTE');
            }

            if (totalCalories) totalCalories.textContent = totals.calories;
            if (totalProteins) totalProteins.textContent = totals.proteins;
            if (totalCarbs) totalCarbs.textContent = totals.carbs;
            if (totalFats) totalFats.textContent = totals.fats;
            
            if (foodsSummary) {
                console.log('🔍 Exibindo o resumo (display=block)');
                foodsSummary.style.display = 'block';
            } else {
                console.warn('⚠️ foodsSummary não encontrado no DOM');
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar resumo:', error);
        }
    }

    // ...existing code...
    function showToast(title, message, type = 'info') {
        const toastElRef = document.getElementById('liveToast'); // Re-get or use global if sure
        const toastTitleElRef = document.getElementById('toastTitle');
        const toastBodyElRef = document.getElementById('toastBody');
        if (!toastElRef || !toastTitleElRef || !toastBodyElRef) {
            console.error("Elementos do Toast não encontrados!");
            return;
        }
        const toastInstance = bootstrap.Toast.getOrCreateInstance(toastElRef);

        toastTitleElRef.textContent = title;
        toastBodyElRef.textContent = message;
        toastElRef.className = 'toast'; // Reset classes
        let toastClass = 'text-bg-info';
        if (type === 'success') toastClass = 'text-bg-success';
        else if (type === 'danger') toastClass = 'text-bg-danger';
        else if (type === 'warning') toastClass = 'text-bg-warning';
        toastElRef.classList.add(toastClass, 'fade');
        toastInstance.show();
    }

    function setButtonLoading(button, isLoading, loadingText = "Carregando...") { 
        if (!button) return;
        if (isLoading) {
            button.disabled = true; button.dataset.originalText = button.innerHTML;
            button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ${loadingText}`;
        } else {
            button.disabled = false; button.innerHTML = button.dataset.originalText || 'Submit';
        }
    }

    function showSpinnerLoading(elementId, show, colspan = 1) {
        const element = document.getElementById(elementId);
        if (!element) return;
        if (show) {
            if (element.tagName === 'TBODY') {
                element.innerHTML = `<tr><td colspan="${colspan}" class="text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></td></tr>`;
            } else {
                element.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Carregando...</span></div></div>`;
            }
        } else { /* A remoção é feita pela renderização do conteúdo real. */ }
     }
    function showAddPatientError(message) { if(addPatientErrorAlert) {addPatientErrorAlert.textContent = message; addPatientErrorAlert.classList.remove('d-none');}}
    function hideAddPatientError() { if(addPatientErrorAlert) addPatientErrorAlert.classList.add('d-none');}
    function showEditPatientError(message) { if (editPatientErrorAlert) {editPatientErrorAlert.textContent = message; editPatientErrorAlert.classList.remove('d-none');}}
    function hideEditPatientError() { if (editPatientErrorAlert) editPatientErrorAlert.classList.add('d-none');}
    function showChangePasswordError(message) { if(changePasswordErrorAlert) {changePasswordErrorAlert.textContent = message; changePasswordErrorAlert.classList.remove('d-none');}}
    function hideChangePasswordError() { if(changePasswordErrorAlert) changePasswordErrorAlert.classList.add('d-none');}
    
    // --- Adicionar função handleAdminLogout (se não existir) ---
    function handleAdminLogout() {
        AlimentaAIDataService.logoutAdmin().then(() => {
            window.location.href = 'index.html';
        });    }

    // --- Adicionar funções handleSetMacrosSubmit e handlePatientSelectionForMacros e clearMacrosForm (se não existir) ---
    async function handleSetMacrosSubmit(event) {
        event.preventDefault();
        
        const patientId = selectPatientForMacros.value;
        const macros = {
            calories: parseFloat(macroCaloriesInput.value),
            proteins: parseFloat(macroProteinsInput.value),
            carbs: parseFloat(macroCarbsInput.value),
            fats: parseFloat(macroFatsInput.value)
        };

        if (!patientId) {
            showToast('Erro', 'Selecione um paciente.', 'danger');
            return;
        }
        
        if (isNaN(macros.calories) || isNaN(macros.proteins) || isNaN(macros.carbs) || isNaN(macros.fats)) {
            showToast('Erro', 'Todos os campos de macros devem ser números válidos.', 'danger');
            return;
        }
        
        if (macros.calories < 0 || macros.proteins < 0 || macros.carbs < 0 || macros.fats < 0) {
            showToast('Erro', 'Os valores dos macros não podem ser negativos.', 'danger');
            return;
        }

        const submitButton = setMacrosForm.querySelector('button[type="submit"]');
        setButtonLoading(submitButton, true, 'Salvando...');
        
        try {
            console.log('💾 Salvando macros:', { patientId, macros });
            
            const result = await AlimentaAIDataService.savePatientMacros(patientId, macros);
            
            if (result && result.success) {
                showToast('Sucesso', result.message || 'Macros salvos com sucesso!', 'success');
                console.log('✅ Macros salvos com sucesso');
            } else {
                const errorMsg = result ? result.message : 'Não foi possível salvar as macros.';
                console.error('❌ Erro ao salvar macros:', errorMsg);
                showToast('Erro', errorMsg, 'danger');
            }
        } catch (error) {
            console.error('❌ Erro na requisição:', error);
            showToast('Erro', 'Falha ao comunicar com o servidor.', 'danger');        } finally {
            setButtonLoading(submitButton, false, 'Salvar Macros');
        }
    }

    async function handlePatientSelectionForMacros() {
        const patientId = selectPatientForMacros.value;
        if (!patientId) {
            clearMacrosForm();
            return;
        }
        
        console.log('🎯 Carregando macros para paciente ID:', patientId);
        
        try {
            // Buscar macros atuais do paciente
            const result = await AlimentaAIDataService.getPatientMacros(patientId);
            
            if (result && result.success && result.macros) {
                console.log('✅ Macros carregados:', result.macros);
                
                // Preencher os campos com os valores atuais
                macroCaloriesInput.value = result.macros.calories || '';
                macroProteinsInput.value = result.macros.proteins || '';
                macroCarbsInput.value = result.macros.carbs || '';
                macroFatsInput.value = result.macros.fats || '';
                
                // Mostrar mensagem informativa se há macros definidos
                if (result.macros.calories > 0 || result.macros.proteins > 0 || 
                    result.macros.carbs > 0 || result.macros.fats > 0) {
                    console.log('ℹ️ Macros atuais carregados nos campos');
                } else {
                    console.log('ℹ️ Paciente sem macros definidos - campos em branco');
                }
            } else {
                console.warn('⚠️ Macros não encontrados para o paciente:', result);
                clearMacrosForm();
            }
        } catch (error) {
            console.error('❌ Erro ao carregar macros do paciente:', error);
            showToast('Erro', 'Não foi possível carregar as macros do paciente.', 'danger');
            clearMacrosForm();
        }
    }

    function clearMacrosForm() {
        setMacrosForm.reset(); // Reseta os valores do formulário
        selectPatientForMacros.value = ""; // Limpa a seleção do paciente
    }

});