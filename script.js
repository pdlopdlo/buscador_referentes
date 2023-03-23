// Cargar los datos desde el archivo data.js
var data = window.data;

// Obtener los elementos del DOM
var searchInput = document.getElementById('search');
var resultsList = document.getElementById('results');

// Función para realizar la búsqueda
function search() {
	// Obtener el término de búsqueda
	var term = searchInput.value.toLowerCase().trim();

	// Limpiar los resultados anteriores
	resultsList.innerHTML = '';

	// Recorrer los datos y buscar los que coinciden con el término de búsqueda
	for (var i = 0; i < data.length; i++) {
		var item = data[i];
		if (item.comuna.toLowerCase().indexOf(term) > -1 || 
			item.tipo.toLowerCase().indexOf(term) > -1 ||
			item.nombre.toLowerCase().indexOf(term) > -1 ||
			item.referente.toLowerCase().indexOf(term) > -1 ||
			item.fono.toLowerCase().indexOf(term) > -1 ||
			item.mail.toLowerCase().indexOf(term) > -1) {
			// Si el elemento coincide, agregarlo a la lista de resultados
			var li = document.createElement('li');
			li.innerHTML = '<span>Comuna:</span> ' + item.comuna + '<br>' +
						   '<span>Tipo:</span> ' + item.tipo + '<br>' +
						   '<span>Nombre:</span> ' + item.nombre + '<br>' +
						   '<span>Referente:</span> ' + item.referente + '<br>' +
						   '<span>Fono:</span> ' + item.fono + '<br>' +
						   '<span>Mail:</span> ' + item.mail;
			resultsList.appendChild(li);
		}
	}
}

// Agregar un evento de escucha para el campo de búsqueda
searchInput.addEventListener('keyup', search);
