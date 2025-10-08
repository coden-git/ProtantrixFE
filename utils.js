export const formatDateTime = (val) => {
        try {
            const d = new Date(val);
            if (isNaN(d)) return '';
            const date = d.toLocaleDateString();
            const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `${date} ${time}`;
        } catch {
            return '';
        }
    };