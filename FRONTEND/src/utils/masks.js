// Aplicar máscara de telefone celular (XX) XXXXX-XXXX
export const applyPhoneMask = (val) => {
    if (!val) return '';
    let v = String(val).replace(/\D/g, '').slice(0, 11);
    if (!v) return '';
    if (v.length > 10) return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    if (v.length > 6) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
    if (v.length > 2) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
    return `(${v}`;
};

// Aplicar máscara de CPF/CNPJ (Legado)
export const applyCpfCnpjMask = (value) => {
    if (!value) return '';
    let v = value.replace(/\D/g, '').slice(0, 14);
    if (v.length <= 11) {
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
        v = v.replace(/^(\d{2})(\d)/, '$1.$2');
        v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
        v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
        v = v.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
    return v;
};
// Aplicar máscara de contrato
export const applyContratoMask = (value) => {
    if (!value) return '';
    let v = value.replace(/\D/g, '').slice(0, 12);
    v = v.replace(/^(\d{3})(\d)/, '$1/$2');
    return v;
};
// Aplicar máscara de moeda
export const applyCurrencyMask = (value) => {
    if (value === null || value === undefined || value === '') return '';
    if (typeof value === 'number') value = value.toFixed(2);
    let v = String(value).replace(/\D/g, '');
    if (v === '') return '';
    v = (parseInt(v, 10) / 100).toFixed(2);
    v = v.replace('.', ',');
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return `R$ ${v}`;
};
// Aplicar máscara de data
export const parseCurrencyToFloat = (value) => {
    if (!value) return 0;
    let v = String(value).replace(/\D/g, '');
    return parseFloat(v) / 100;
};
// Aplicar máscara de data E hora
export const applyDateShortMask = (value) => {
    if (!value) return '';
    let v = value.replace(/\D/g, '').slice(0, 6);
    if (v.length > 4) {
        v = v.replace(/^(\d{2})(\d{2})(\d{2})/, '$1/$2/$3');
    } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d{2})/, '$1/$2');
    }
    return v;
};
// Aplicar máscara de OV
export const applyOvMask = (value) => {
    if (!value) return '';
    return value.replace(/\D/g, '').slice(0, 10);
};
// Aplicar máscara de data EM horario local
export const getTodaySP = () => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
};
// Aplicar máscara de semana
export const weekDaysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
export const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();