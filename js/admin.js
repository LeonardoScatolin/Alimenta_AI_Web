// Backup do admin.js antes de restaurar
console.log('🚀 ADMIN.JS: Script iniciado!');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 ADMIN.JS: DOMContentLoaded disparado!');
    
    // Autenticação
    if (!AlimentaAIDataService.isAdminLoggedIn()) {
        console.log('❌ ADMIN.JS: Usuário não autenticado, redirecionando...');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('✅ ADMIN.JS: Usuário autenticado, continuando...');

    // Elementos do DOM Globais
    const adminNamePlaceholder = document.getElementById('adminNamePlaceholder');
    const activePatientsCount = document.getElementById('activePatientsCount');
    const patientsTableBody = document.getElementById('patientsTableBody');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    
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
    const patientEmailForPasswordChangeText = document.getElementById('patientEmailForPasswordChangeText');
    const changePasswordPatientEmailInput = document.getElementById('changePasswordPatientEmail');
    const changePasswordPatientIdInput = document.getElementById('changePasswordPatientId');
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
        setupFoodsTab();
    }

    function displayAdminInfo() {
        const adminInfo = AlimentaAIDataService.getLoggedInAdminInfo();
        if (adminInfo && adminNamePlaceholder) {
            adminNamePlaceholder.textContent = adminInfo.email;
        }
    }

    function setupEventListeners() {
        if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', handleAdminLogout);
        
        if (addPatientForm) addPatientForm.addEventListener('submit', handleAddPatientSubmit);
        if (editPatientForm) editPatientForm.addEventListener('submit', handleEditPatientSubmit);
        
        if (editPatientModalEl) {
            editPatientModalEl.addEventListener('show.bs.modal', async (event) => {
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
                if(patientEmailForPasswordChangeText) patientEmailForPasswordChangeText.textContent = displayEmail;
                changePasswordPatientEmailInput.value = displayEmail;
                newPasswordInput.value = '';
                hideChangePasswordError();
            });
        }

        if (setMacrosForm) setMacrosForm.addEventListener('submit', handleSetMacrosSubmit);
        if (selectPatientForMacros) selectPatientForMacros.addEventListener('change', handlePatientSelectionForMacros);
        if (clearMacrosFormBtn) clearMacrosFormBtn.addEventListener('click', clearMacrosForm);

        // Event listeners para a aba de alimentos
        if (loadFoodsBtn) {
            loadFoodsBtn.addEventListener('click', function(event) {
                event.preventDefault();
                handleLoadFoods();
            });
        }
        
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

    // === FUNÇÕES DE APOIO ===

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
    }    async function handleAdminLogout() {
        try {
            await AlimentaAIDataService.logoutAdmin();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            // Mesmo com erro, limpa o localStorage e redireciona
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminUser');
            window.location.href = 'index.html';
        }
    }

    function showToast(title, message, type = 'success') {
        if (toastTitleEl) toastTitleEl.textContent = title;
        if (toastBodyEl) toastBodyEl.textContent = message;
        
        // Remover classes de tipo anteriores
        toastEl.classList.remove('text-bg-success', 'text-bg-danger', 'text-bg-warning', 'text-bg-info');
        
        // Adicionar classe baseada no tipo
        switch(type) {
            case 'success': toastEl.classList.add('text-bg-success'); break;
            case 'danger': toastEl.classList.add('text-bg-danger'); break;
            case 'warning': toastEl.classList.add('text-bg-warning'); break;
            case 'info': toastEl.classList.add('text-bg-info'); break;
            default: toastEl.classList.add('text-bg-success'); break;
        }
        
        toast.show();
    }

    function showSpinnerLoading(containerId, show = true, colspan = 1) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (show) {
            container.innerHTML = `
                <tr>
                    <td colspan="${colspan}" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Carregando...</span>
                        </div>
                    </td>
                </tr>`;
        }
    }

    function setButtonLoading(button, isLoading, originalText) {
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            button.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ${originalText}
            `;
        } else {
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

    function showAddPatientError(message) {
        if (addPatientErrorAlert) {
            addPatientErrorAlert.style.display = 'block';
            addPatientErrorAlert.textContent = message;
        }
    }

    function hideAddPatientError() {
        if (addPatientErrorAlert) {
            addPatientErrorAlert.style.display = 'none';
        }
    }

    function showEditPatientError(message) {
        if (editPatientErrorAlert) {
            editPatientErrorAlert.style.display = 'block';
            editPatientErrorAlert.textContent = message;
        }
    }

    function hideEditPatientError() {
        if (editPatientErrorAlert) {
            editPatientErrorAlert.style.display = 'none';
        }
    }

    function showChangePasswordError(message) {
        if (changePasswordErrorAlert) {
            changePasswordErrorAlert.style.display = 'block';
            changePasswordErrorAlert.textContent = message;
        }
    }

    function hideChangePasswordError() {
        if (changePasswordErrorAlert) {
            changePasswordErrorAlert.style.display = 'none';
        }
    }

    // === FUNÇÕES DE GERENCIAMENTO DE PACIENTES ===

    async function loadAndDisplayPatients() {
        showSpinnerLoading('patientsTableBody', true, 6);
        try {
            const result = await AlimentaAIDataService.getPatients();
            console.log("loadAndDisplayPatients - Resultado recebido:", result);
              if (result.success && result.patients) {
                const patients = result.patients;
                const activePatients = patients.filter(patient => patient.status === 'active');
                renderPatientsTable(patients); 
                populatePatientSelect(patients); 
                await updateDashboardStats(activePatients.length);
                showToast('Sucesso', `${patients.length} paciente(s) carregado(s) (${activePatients.length} ativo(s))`, 'success');
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
            renderPatientsTable([]); 
            populatePatientSelect([]); 
            await updateDashboardStats(0);
        } finally {
            showSpinnerLoading('patientsTableBody', false);
        }
    }    function renderPatientsTable(patients) {
        if (!patientsTableBody) { 
            console.error("Elemento patientsTableBody não encontrado!"); 
            return; 
        }
        
        patientsTableBody.innerHTML = '';
        
        if (!patients || patients.length === 0) {
            patientsTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Nenhum paciente cadastrado.</td></tr>`;
            return;
        }
          patients.forEach((patient, index) => {
            const row = patientsTableBody.insertRow();
            // Usar o campo ativo (1 ou 0) para determinar o status
            const isActive = patient.status === 'active';
            const statusText = isActive ? 'Ativo' : 'Desativado';
            const statusClass = isActive ? 'badge bg-success' : 'badge bg-danger';
            const toggleButtonText = isActive ? 'Desativar' : 'Ativar';
            const toggleButtonClass = isActive ? 'btn-outline-danger' : 'btn-outline-success';
            const toggleButtonIcon = isActive ? 'bi-toggle-off' : 'bi-toggle-on';
            
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
                    </button>                    <button class="btn btn-sm btn-danger mb-1 btn-remove-patient" 
                            data-patient-id="${patient.id}" data-patient-name="${patient.name || patient.email}"
                            title="EXCLUIR permanentemente do sistema">
                        <i class="bi bi-trash-fill"></i> <span class="d-none d-lg-inline">Excluir</span>
                    </button>
                </td>`;
        });
        
        // Event listeners para botões da tabela
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
    
    async function updateDashboardStats(count = null) {
        if (!activePatientsCount) {
            console.error("Elemento 'activePatientsCount' não foi encontrado no DOM.");
            return;
        }        let finalCount = 0;
        if (count !== null && typeof count === 'number') {
            finalCount = count;
        } else {
            try {
                const result = await AlimentaAIDataService.getPatients();
                if (result.success && Array.isArray(result.patients)) {
                    // Contar apenas pacientes ativos para o dashboard
                    finalCount = result.patients.filter(patient => patient.status === 'active').length;
                } else {
                    finalCount = 0;
                }
            } catch (error) {
                console.error("Erro ao buscar pacientes para atualizar estatísticas do dashboard:", error);
                finalCount = 0;
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
            showAddPatientError("Nome, email e senha são obrigatórios."); 
            return;
        }
        
        const submitButton = addPatientForm.querySelector('button[type="submit"]');
        setButtonLoading(submitButton, true, 'Adicionando...');
        
        try {
            const result = await AlimentaAIDataService.addPatient(patientData);
            if (result && result.success) {
                showToast('Sucesso', `Paciente ${patientData.name} adicionado!`, 'success');
                addPatientForm.reset(); 
                addPatientModal.hide();
                await loadAndDisplayPatients();
            } else { 
                showAddPatientError(result ? result.message : 'Erro desconhecido ao adicionar.');
            }
        } catch (error) { 
            console.error("Catch em handleAddPatientSubmit:", error); 
            showAddPatientError('Falha na comunicação ao adicionar.');
        } finally { 
            setButtonLoading(submitButton, false, 'Adicionar Paciente');
        }
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
            
            if (result && (result.success || result.status)) {
                console.log('✅ Edição bem-sucedida, fechando modal e recarregando lista');
                showToast('Sucesso', `Dados de ${updatedData.name} atualizados!`, 'success');
                
                try {
                    editPatientModal.hide();
                    console.log('✅ Modal de edição fechado com sucesso');
                } catch (modalError) {
                    console.error('❌ Erro ao fechar modal:', modalError);
                }
                
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
    }    async function handleRemovePatient(patientId, patientName) {
        showConfirmationModal('⚠️ EXCLUIR PERMANENTEMENTE', 
            `<div class="alert alert-danger">
                <strong>ATENÇÃO:</strong> Esta ação irá <strong>DELETAR PERMANENTEMENTE</strong> o paciente <strong>${patientName}</strong> e todos os seus dados do sistema.
                <br><br>
                <strong>Esta ação NÃO PODE ser desfeita!</strong>
                <br><br>
                Se você deseja apenas desativar o paciente temporariamente, use o botão "Desativar" ao lado.
            </div>
            <p>Tem certeza que deseja <strong>EXCLUIR PERMANENTEMENTE</strong> este paciente?</p>`,            async () => {
                try {
                    console.log('🗑️ Iniciando exclusão do paciente ID:', patientId);
                    const result = await AlimentaAIDataService.removePatient(patientId);
                    console.log('📡 Resultado da exclusão:', result);
                    
                    if (result && result.success) {
                        showToast('Sucesso', `Paciente ${patientName} excluído permanentemente!`, 'success');
                        await loadAndDisplayPatients();
                    } else { 
                        console.error('❌ Erro na exclusão:', result);
                        showToast('Erro', result ? result.message : 'Não foi possível excluir.', 'danger');
                    }
                } catch (error) { 
                    console.error('❌ Erro crítico na exclusão:', error); 
                    showToast('Erro', 'Falha no servidor: ' + error.message, 'danger');
                } finally { 
                    confirmationModal.hide(); 
                }
            }, 'btn-danger', 'Sim, EXCLUIR PERMANENTEMENTE');
    }

    async function handleChangePasswordSubmit(event) {
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
            
            if (result && (result.success || result.status)) {
                console.log('✅ Alteração de senha bem-sucedida, fechando modal');
                showToast('Sucesso', `Senha de ${patientEmail} alterada!`, 'success'); 
                
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
        
        showConfirmationModal(`Confirmar Status`, 
            `Deseja <strong>${actionText}</strong> o paciente <strong>${patientName}</strong>?`,
            async () => {
                try {
                    const result = await AlimentaAIDataService.setPatientStatus(patientId, newStatus); 
                    if (result && result.success) { 
                        showToast('Sucesso', result.message || `Status alterado!`, 'success'); 
                        await loadAndDisplayPatients();
                    } else { 
                        showToast('Erro', result ? result.message : 'Não foi possível alterar.', 'danger');
                    }
                } catch (e) { 
                    console.error(e); 
                    showToast('Erro', 'Falha no servidor.', 'danger');
                } finally { 
                    confirmationModal.hide(); 
                }
            }, newStatus === 'active' ? 'btn-success' : 'btn-warning', `Sim, ${actionText}`);
    }
    
    // === FUNÇÕES DA ABA DE MACROS ===

    function setupFoodsTab() {
        // Definir data de hoje como padrão
        if (foodsDate) {
            foodsDate.value = new Date().toISOString().split('T')[0];
        }
    }

    function populatePatientSelect(patients) {
        if (!Array.isArray(patients)) { 
            console.error("populatePatientSelect: patients não é array"); 
            return; 
        }
        
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

    async function handlePatientSelectionForMacros() {
        const selectedPatientId = selectPatientForMacros.value;
        
        if (!selectedPatientId) {
            clearMacrosForm();
            return;
        }

        console.log('🎯 Carregando macros para o paciente:', selectedPatientId);
        
        try {
            const macros = await AlimentaAIDataService.getPatientMacros(selectedPatientId);
            console.log('📊 Macros recebidos:', macros);
              if (macros && macros.success && macros.data) {
                const macroData = macros.data;
                  // Preencher os campos com 2 casas decimais
                macroCaloriesInput.value = Number(macroData.calories || macroData.calorias || 0).toFixed(2);
                macroProteinsInput.value = Number(macroData.proteins || macroData.proteina || 0).toFixed(2);
                macroCarbsInput.value = Number(macroData.carbs || macroData.carbo || macroData.carboidrato || 0).toFixed(2);
                macroFatsInput.value = Number(macroData.fats || macroData.gordura || 0).toFixed(2);
                
                showToast('Info', 'Macros carregados com sucesso!', 'info');
            } else {
                console.log('ℹ️ Nenhum macro definido para este paciente');
                clearMacrosForm();
                showToast('Info', 'Nenhum macro definido para este paciente', 'info');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar macros:', error);
            clearMacrosForm();
            showToast('Erro', 'Erro ao carregar macros do paciente', 'danger');
        }
    }

    async function handleSetMacrosSubmit(event) {
        event.preventDefault();
        
        const selectedPatientId = selectPatientForMacros.value;
        
        if (!selectedPatientId) {
            showToast('Aviso', 'Selecione um paciente primeiro', 'warning');
            return;
        }        const macroData = {
            calories: parseFloat(macroCaloriesInput.value) || 0,
            proteins: parseFloat(macroProteinsInput.value) || 0,
            carbs: parseFloat(macroCarbsInput.value) || 0,
            fats: parseFloat(macroFatsInput.value) || 0
        };
        
        console.log('💾 Salvando macros:', { selectedPatientId, macroData });
        
        const submitButton = setMacrosForm.querySelector('button[type="submit"]');
        setButtonLoading(submitButton, true, 'Salvando...');
        
        try {
            const result = await AlimentaAIDataService.savePatientMacros(selectedPatientId, macroData);
            console.log('📊 Resultado do salvamento:', result);
            
            if (result && result.success) {
                showToast('Sucesso', 'Macros salvos com sucesso!', 'success');
            } else {
                showToast('Erro', result?.message || 'Erro ao salvar macros', 'danger');
            }
        } catch (error) {
            console.error('❌ Erro ao salvar macros:', error);
            showToast('Erro', 'Erro na comunicação com o servidor', 'danger');
        } finally {
            setButtonLoading(submitButton, false, 'Salvar Macros');
        }
    }

    function clearMacrosForm() {
        if (macroCaloriesInput) macroCaloriesInput.value = '';
        if (macroProteinsInput) macroProteinsInput.value = '';
        if (macroCarbsInput) macroCarbsInput.value = '';
        if (macroFatsInput) macroFatsInput.value = '';
    }

    // === FUNÇÕES DA ABA DE ALIMENTOS CONSUMIDOS ===

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
        console.log('🚀 FRONTEND: handleLoadFoods INICIOU!');
        
        const selectedPatientId = selectPatientForFoods.value;
        const selectedDate = foodsDate.value;
        
        console.log('📊 FRONTEND: Parâmetros da busca:', { selectedPatientId, selectedDate });
        
        if (!selectedPatientId) {
            showToast('Aviso', 'Selecione um paciente primeiro', 'warning');
            return;
        }
        
        if (!selectedDate) {
            showToast('Aviso', 'Selecione uma data', 'warning');
            return;
        }

        // Mostrar loading na tabela
        if (foodsTableBody) {
            foodsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Carregando...</span>
                        </div>
                        <div class="mt-2">Carregando alimentos...</div>
                    </td>
                </tr>`;
        }
        
        // Esconder resumo durante loading
        if (foodsSummary) {
            foodsSummary.style.display = 'none';
        }

        const loadButton = loadFoodsBtn;
        setButtonLoading(loadButton, true, 'Carregando...');
        
        try {
            console.log('🌐 FRONTEND: Fazendo requisição para a API...');
            const result = await AlimentaAIDataService.getConsumedFoodsByDate(selectedPatientId, selectedDate);
            console.log('📊 FRONTEND: Resultado da API:', result);
            
            if (result && result.success) {
                console.log('✅ FRONTEND: Dados recebidos com sucesso!');
                
                const foods = result.foods || [];
                const totals = result.totals || {
                    total_calorias: 0,
                    total_proteina: 0,
                    total_carboidrato: 0,
                    total_gordura: 0
                };
                
                console.log('🍽️ FRONTEND: Alimentos:', foods);
                console.log('📊 FRONTEND: Totais:', totals);
                
                renderFoodsTable(foods);
                updateFoodsSummary(totals);
                
                showToast('Sucesso', `${foods.length} registro(s) encontrado(s)`, 'success');
            } else {
                console.log('ℹ️ FRONTEND: Nenhum alimento encontrado');
                renderFoodsTable([]);
                updateFoodsSummary({ total_calorias: 0, total_proteina: 0, total_carboidrato: 0, total_gordura: 0 });
                showToast('Info', result?.message || 'Nenhum alimento encontrado para esta data', 'info');
            }
        } catch (error) {
            console.error('❌ FRONTEND: Erro ao carregar alimentos:', error);
            
            if (foodsTableBody) {
                foodsTableBody.innerHTML = `
                    <tr>
                        <td colspan="8" class="text-center text-danger">
                            <i class="bi bi-exclamation-triangle"></i> Erro ao carregar dados
                        </td>
                    </tr>`;
            }
            
            if (foodsSummary) {
                foodsSummary.style.display = 'none';
            }
            
            showToast('Erro', 'Erro ao carregar alimentos consumidos', 'danger');
        } finally {
            setButtonLoading(loadButton, false, 'Buscar');
        }
    }

    function renderFoodsTable(foods) {
        console.log('📋 FRONTEND: Renderizando tabela com', foods.length, 'alimentos');
        
        if (!foodsTableBody) {
            console.error('❌ FRONTEND: foodsTableBody não encontrado!');
            return;
        }
        
        if (!foods || foods.length === 0) {
            foodsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        <i class="bi bi-info-circle"></i> Nenhum alimento registrado para esta data
                    </td>
                </tr>`;
            return;
        }
        
        foodsTableBody.innerHTML = '';
          foods.forEach((food, index) => {
            const row = foodsTableBody.insertRow();            row.innerHTML = `
                <td>${food.refeicao || 'N/A'}</td>
                <td>${food.nome_alimento || 'N/A'}</td>
                <td>${food.quantidade || '0g'}</td>
                <td>${Number(food.calorias || 0).toFixed(2)}</td>
                <td>${Number(food.proteina || 0).toFixed(2)}g</td>
                <td>${Number(food.carboidrato || 0).toFixed(2)}g</td>
                <td>${Number(food.gordura || 0).toFixed(2)}g</td>
                <td>${food.horario || 'N/A'}</td>
            `;
        });
        
        console.log('✅ FRONTEND: Tabela renderizada com sucesso!');
    }

    function updateFoodsSummary(totals) {
        console.log('📊 FRONTEND: Atualizando resumo com totais:', totals);
        
        if (!totals) {
            console.error('❌ FRONTEND: totals é undefined');
            return;
        }
        
        // Atualizar elementos do resumo com 2 casas decimais
        if (totalCalories) totalCalories.textContent = Number(totals.total_calorias || 0).toFixed(2);
        if (totalProteins) totalProteins.textContent = Number(totals.total_proteina || 0).toFixed(2);
        if (totalCarbs) totalCarbs.textContent = Number(totals.total_carboidrato || 0).toFixed(2);
        if (totalFats) totalFats.textContent = Number(totals.total_gordura || 0).toFixed(2);
        
        // Mostrar o resumo
        if (foodsSummary) {
            foodsSummary.style.display = 'block';
        }
        
        console.log('✅ FRONTEND: Resumo atualizado com sucesso!');
    }

});
