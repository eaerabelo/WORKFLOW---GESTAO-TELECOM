import cron from 'node-cron';

/**
 * Inicializa todas as rotinas automatizadas do sistema
 * @param {import('socket.io').Server} io Instância do Socket.io para falar com o React
 */
export const initCronJobs = (io) => {
    console.log("⏰ Inicializando Rotinas Agendadas (Cron Jobs)...");

    // ------------------------------------------------------------------------
    // 1. ALERTA DAS 14h - Todo dia às 14:00 (Fuso horário do servidor)
    // ------------------------------------------------------------------------
    cron.schedule('0 14 * * *', () => {
        console.log("[CRON] Disparando alerta das 14h para todas as máquinas conectadas.");
        
        // Emite o evento "alerta-global" para o Frontend
        io.emit('alerta-global', {
            title: 'Atenção, Vendedor(a)! ⏰',
            message: 'Já são 14h! Não se esqueça de sincronizar suas vendas e checar os status dos contratos.',
            type: 'warning'
        });
    });

    // ------------------------------------------------------------------------
    // 2. ALERTA DE FECHAMENTO - Todo dia às 18:00
    // ------------------------------------------------------------------------
    cron.schedule('0 18 * * *', () => {
        console.log("[CRON] Disparando alerta das 18h para todas as máquinas conectadas.");
        
        io.emit('alerta-global', {
            title: 'Fim do Expediente Chegando! 🌇',
            message: 'Certifique-se de que tudo foi sincronizado com a nuvem antes de desligar a máquina.',
            type: 'info'
        });
    });

    // Adicione quantas rotinas você precisar aqui embaixo!
    // Você pode até chamar funções de banco de dados (ex: oracleService) para gerar relatórios automáticos.
};
