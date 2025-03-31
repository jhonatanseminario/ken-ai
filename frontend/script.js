const bienvenida = document.getElementById('bienvenida');
const formulario = document.getElementById('formulario');
const input = document.getElementById('nombre');

formulario.addEventListener('submit', async(event) => {
    event.preventDefault();

    const nombre = input.value.trim();
  
    if (!nombre) {
        console.warn('El campo "nombre" es requerido y no puede estar vacío.');
        return;
    }

    try {
        const response = await fetch('/.netlify/functions/index', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre })
        });
  
        if (!response.ok) {
            const errorData = await response.json();
            console.error(`Error en el servidor: ${errorData.error}`);
            return;
        }

        const data = await response.json();
        bienvenida.textContent = data.bienvenida;
      
    } catch (error) {
        console.error(`No se pudo establecer la conexión con el servidor: ${error}`);
    }
});
