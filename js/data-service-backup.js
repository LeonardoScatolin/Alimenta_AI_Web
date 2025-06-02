(function(window) {
    'use strict';

    const API_BASE_URL = 'http://127.0.0.1:3333'; // URL da sua API BackAlimenta

    const DataService = {
        authenticateAdmin: async function(email, password) {
            try {
                console.log('🔐 Tentando login da nutricionista...', { email });
                
                const response = await fetch(`${API_BASE_URL}/nutri/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, senha: password })
                });
                
                const data = await response.json();
                console.log('📡 Resposta da API:', data);
                
                if (data.status && data.token) {
                    // Salvar dados da nutricionista logada
                    const adminInfo = {
                        id: data.nutri.nutri_id,
                        email: data.nutri.email,
                        name: data.nutri.nome,
                        token: data.token
                    };
                    
                    localStorage.setItem('adminLoggedIn', 'true');
                    localStorage.setItem('adminUser', JSON.stringify(adminInfo));
                    
                    console.log('✅ Login bem-sucedido!', adminInfo);
                    
                    return {
                        success: true,
                        admin: adminInfo
                    };
                } else {
                    console.log('❌ Falha no login:', data.message || data.error);
                    localStorage.removeItem('adminLoggedIn');
                    localStorage.removeItem('adminUser');
                    return {
                        success: false,
                        message: data.message || data.error || 'Credenciais inválidas'
                    };
                }
            } catch (error) {
                console.error('❌ Erro na requisição de login:', error);
                localStorage.removeItem('adminLoggedIn');
                localStorage.removeItem('adminUser');
                return {
                    success: false,
                    message: 'Erro de conexão. Verifique se a API está rodando.'
                };
            }
        },

        isAdminLoggedIn: function() {
            return localStorage.getItem('adminLoggedIn') === 'true';
        },

        getLoggedInAdminInfo: function() {
            if (this.isAdminLoggedIn()) {
                try { 
                    return JSON.parse(localStorage.getItem('adminUser')); 
                } catch (e) { 
                    return null; 
                }
            }
            return null;
        },

        logoutAdmin: async function() {
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminUser');
            return { success: true };
        },

        getPatients: async function() {
            try {
                const adminInfo = this.getLoggedInAdminInfo();
                if (!adminInfo || !adminInfo.id) {
                    return { success: false, message: 'Usuário não autenticado' };
                }

                console.log('👥 Buscando pacientes da nutricionista ID:', adminInfo.id);

                const response = await fetch(`${API_BASE_URL}/nutri/pacientes/${adminInfo.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminInfo.token}`
                    }
                });

                const data = await response.json();
                console.log('📡 Resposta dos pacientes:', data);

                if (data.status && data.pacientes) {
                    // Transformar dados para o formato esperado pelo front-end
                    const patients = data.pacientes.map(p => ({
                        id: p.paciente_id,
                        name: p.nome,
                        email: p.email,
                        phone: p.telefone || '',
                        status: p.ativo ? 'active' : 'inactive',
                        macros: { 
                            calories: p.calorias_meta || 2000, 
                            proteins: p.proteina_meta || 150, 
                            carbs: p.carbo_meta || 200, 
                            fats: p.gordura_meta || 70 
                        },
                        createdAt: p.data_criacao || new Date().toISOString()
                    }));

                    return { success: true, patients };
                } else {
                    return { success: false, message: data.message || 'Erro ao buscar pacientes', patients: [] };
                }
            } catch (error) {
                console.error('❌ Erro ao buscar pacientes:', error);
                return { success: false, message: 'Erro de conexão', patients: [] };
            }
        },

        addPatient: async function(patientData) {
            try {
                const adminInfo = this.getLoggedInAdminInfo();
                if (!adminInfo || !adminInfo.id) {
                    return { success: false, message: 'Usuário não autenticado' };
                }

                console.log('➕ Adicionando novo paciente...', patientData);

                const response = await fetch(`${API_BASE_URL}/paciente/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${adminInfo.token}`
                    },
                    body: JSON.stringify({
                        nome: patientData.name,
                        email: patientData.email,
                        senha: patientData.password,
                        telefone: patientData.phone,
                        peso: 70, // Peso padrão
                        nutri_id: adminInfo.id
                    })
                });

                const data = await response.json();
                console.log('📡 Resposta do cadastro:', data);

                if (data.status) {
                    return { 
                        success: true, 
                        message: 'Paciente adicionado com sucesso!' 
                    };
                } else {
                    return { 
                        success: false, 
                        message: data.message || data.error || 'Erro ao adicionar paciente' 
                    };
                }
            } catch (error) {
                console.error('❌ Erro ao adicionar paciente:', error);
                return { success: false, message: 'Erro de conexão' };
            }
        },

        updatePatientDetails: function(patientId, dataToUpdate) {
            // TODO: Implementar atualização de paciente na API
            console.log('⚠️ updatePatientDetails não implementado ainda');
            return Promise.resolve({ success: false, message: 'Funcionalidade não implementada' });
        },

        getPatientById: function(patientId) {
            // TODO: Implementar busca de paciente por ID na API
            console.log('⚠️ getPatientById não implementado ainda');
            return Promise.resolve(null);
        },

        removePatient: function(patientEmailOrId) {
            // TODO: Implementar remoção de paciente na API
            console.log('⚠️ removePatient não implementado ainda');
            return Promise.resolve({ success: false, message: 'Funcionalidade não implementada' });
        },

        updatePatientPassword: function(patientEmailOrId, newPassword) {
            // TODO: Implementar alteração de senha na API
            console.log('⚠️ updatePatientPassword não implementado ainda');
            return Promise.resolve({ success: false, message: 'Funcionalidade não implementada' });
        },

        setPatientMacros: function(patientId, macros) {
            // TODO: Implementar definição de macros na API
            console.log('⚠️ setPatientMacros não implementado ainda');
            return Promise.resolve({ success: false, message: 'Funcionalidade não implementada' });
        }
    };

    // Expor o DataService globalmente
    window.AlimentaAIDataService = DataService;

})(window);
