$(document).ready(function() {
   // Configuração do Dark Mode
  function setDarkMode(isDark) {
    if (isDark) {
      $('body').addClass('dark-mode');
      $('.kanban-column').addClass('dark-mode-column');
      $('.task-list').addClass('dark-mode-task-list');
      $('.task-card').addClass('dark-mode-task-card');
      $('.new-task-input').addClass('dark-mode-input');
      $('#darkModeToggle').html('<i class="fas fa-sun"></i> Light Mode');
    } else {
      $('body').removeClass('dark-mode');
      $('.kanban-column').removeClass('dark-mode-column');
      $('.task-list').removeClass('dark-mode-task-list');
      $('.task-card').removeClass('dark-mode-task-card');
      $('.new-task-input').removeClass('dark-mode-input');
      $('#darkModeToggle').html('<i class="fas fa-moon"></i> Dark Mode');
    }
    localStorage.setItem('kanban-dark-mode', isDark);
  }

  // Inicializar dark mode (padrão: dark, mas verifica localStorage)
  const prefersDark = localStorage.getItem('kanban-dark-mode') !== 'false';
  setDarkMode(prefersDark);

  // Alternar dark/light mode
  $('#darkModeToggle').click(function() {
    const isDark = !$('body').hasClass('dark-mode');
    setDarkMode(isDark);
  });

  // Limpar storage antigo se existir
  if (localStorage.getItem('kanban-tasks')?.includes('task-card')) {
    localStorage.removeItem('kanban-tasks');
  }

  // Adicionar nova tarefa (para todas as colunas)
  $('.add-task-btn').click(function() {
    const columnId = $(this).data('column');
    const input = $(this).siblings('.new-task-input');
    const taskText = input.val().trim();
    
    if (taskText && !taskExists(taskText)) {
      createTask(columnId, taskText);
      input.val('');
      saveTasks();
    }
  });

  // Tecla Enter para adicionar
  $('.new-task-input').keypress(function(e) {
    if (e.which === 13) {
      const columnId = $(this).data('column');
      $(`.add-task-btn[data-column="${columnId}"]`).click();
    }
  });

  // Verificar se tarefa já existe
  function taskExists(text) {
    const tasks = getCurrentTasks();
    return Object.values(tasks).some(col => col.includes(text));
  }

  // Criar elemento de tarefa
  function createTask(columnId, text) {
    const taskId = 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const $task = $(`
      <div id="${taskId}" class="task-card card">
        <div class="card-body p-2 d-flex justify-content-between align-items-center">
          <span class="task-content">${text}</span>
          <button class="delete-task btn btn-sm btn-danger">×</button>
        </div>
      </div>
    `);
    
    $('#' + columnId).append($task);
    initDraggable($task);
    initDeleteButton($task);
  }

  // Inicializar botão de deletar
  function initDeleteButton($element) {
    $element.find('.delete-task').click(function() {
      $(this).closest('.task-card').remove();
      saveTasks();
    });
  }

  // Inicializar arrasto
  function initDraggable($element) {
    $element.draggable({
      revert: "invalid",
      cursor: "move",
      zIndex: 1000,
      containment: ".container",
      helper: "clone",
      appendTo: "body",
      start: function() {
        $(this).css('opacity', '0.5');
      },
      stop: function() {
        $(this).css('opacity', '1');
      }
    });
  }

  // Configurar áreas de soltar
  $('.task-list').droppable({
    accept: '.task-card',
    tolerance: 'pointer',
    hoverClass: 'ui-droppable-hover',
    drop: function(event, ui) {
      const taskText = ui.draggable.find('.task-content').text();
      
      // Remove de todas as colunas
      removeTaskFromAllColumns(taskText);
      
      // Cria novo card funcional
      const $newCard = ui.draggable.clone();
      $newCard.attr('id', 'task-' + Date.now());
      $newCard.css({
        'position': 'relative',
        'left': '0',
        'top': '0',
        'opacity': '1'
      });
      
      $(this).append($newCard);
      initDraggable($newCard);
      initDeleteButton($newCard);
      saveTasks();
      
      // Remove o card original
      ui.draggable.remove();
    }
  });

  // Remover tarefa de todas as colunas
  function removeTaskFromAllColumns(text) {
    $('.task-card').each(function() {
      if ($(this).find('.task-content').text() === text) {
        $(this).remove();
      }
    });
  }

  // Obter tarefas atuais
  function getCurrentTasks() {
    const tasks = {
      'to-do': [],
      'doing': [],
      'done': []
    };

    $('.task-list').each(function() {
      const columnId = $(this).attr('id');
      $(this).find('.task-content').each(function() {
        tasks[columnId].push($(this).text());
      });
    });

    return tasks;
  }

  // Salvar tarefas
  function saveTasks() {
    localStorage.setItem('kanban-tasks', JSON.stringify(getCurrentTasks()));
  }

  // Carregar tarefas
  function loadTasks() {
    const saved = JSON.parse(localStorage.getItem('kanban-tasks'));
    if (saved) {
      Object.keys(saved).forEach(columnId => {
        saved[columnId].forEach(text => {
          createTask(columnId, text);
        });
      });
    }
  }

  loadTasks();
});