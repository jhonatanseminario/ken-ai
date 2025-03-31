const bienvenida = document.getElementById('bienvenida');
const formulario = document.getElementById('formulario');
const input = document.getElementById('nombre');

formulario.addEventListener('submit', async(event) => {
    event.preventDefault();

    const nombre = input.value.trim();
  
    if (!nombre) {
        console.warn('Debes ingresar tu nombre.');
        return;
    }

    try {
        const response = await fetch('/.netlify/functions/index', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre })
        });
  
        if (!response.ok) {
            console.error('Algo salió mal. Inténtalo de nuevo.');
            return;
        }

        const data = await response.json();
        bienvenida.textContent = data.bienvenida;
      
    } catch (error) {
        console.error(`Error de conexión: ${error}`);
    }
});
