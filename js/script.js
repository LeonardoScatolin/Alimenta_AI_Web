// --- js/script.js ---
document.addEventListener('DOMContentLoaded', () => {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminEmailInput = document.getElementById('adminEmail');
    const adminPasswordInput = document.getElementById('adminPassword');
    const loginErrorAlert = document.getElementById('loginErrorAlert');
    const currentYearSpan = document.getElementById('currentYear');
    const contactForm = document.getElementById('contactForm'); // Para o formulário de contato

    // Atualiza o ano no rodapé
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Lógica de Login do Admin
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            hideLoginError(); 

            const email = adminEmailInput.value.trim();
            const password = adminPasswordInput.value.trim();

            if (!email || !password) {
                showLoginError('Por favor, preencha o email e a senha.');
                return;
            }

            const loginButton = adminLoginForm.querySelector('button[type="submit"]');
            const originalButtonText = loginButton.innerHTML;
            loginButton.disabled = true;
            loginButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Entrando...';

            try {
                // Garante que AlimentaAIDataService esteja carregado
                if (window.AlimentaAIDataService) {
                    const result = await AlimentaAIDataService.authenticateAdmin(email, password);
                    if (result && result.success) {
                        window.location.href = 'admin.html';
                    } else {
                        showLoginError(result ? result.message : 'Falha na autenticação. Verifique suas credenciais.');
                    }
                } else {
                    showLoginError('Serviço de autenticação não disponível. Tente mais tarde.');
                    console.error("AlimentaAIDataService não está definido.");
                }
            } catch (error) {
                console.error('Erro ao tentar autenticar:', error);
                showLoginError('Ocorreu um erro ao tentar fazer login. Tente novamente mais tarde.');
            } finally {
                loginButton.disabled = false;
                loginButton.innerHTML = originalButtonText;
            }
        });
    }

    function showLoginError(message) {
        if (loginErrorAlert) {
            loginErrorAlert.textContent = message;
            loginErrorAlert.classList.remove('d-none');
        }
    }

    function hideLoginError() {
        if (loginErrorAlert) {
            loginErrorAlert.classList.add('d-none');
        }
    }

    // Formulário de Contato (simulação de envio)
    if(contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Simulação de envio bem-sucedido
            // Em uma aplicação real, você enviaria os dados para um backend
            alert('Mensagem enviada com sucesso! (Simulação)'); // Substituir por um toast/feedback melhor
            contactForm.reset();
        });
    }

    // Animações de Scroll com Intersection Observer
    const animatedItems = document.querySelectorAll('.animated-item');
    const observerOptions = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.1 // % do item visível para disparar
    };

    const observer = new IntersectionObserver((entries, observerInstance) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observerInstance.unobserve(entry.target); // Anima apenas uma vez
            }
        });
    }, observerOptions);

    if (animatedItems.length > 0) {
        animatedItems.forEach(item => {
            observer.observe(item);
        });
    } else {
        // console.log("Nenhum item com a classe 'animated-item' encontrado para o IntersectionObserver.");
    }
});