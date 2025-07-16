$(document).ready(function() {
  // Configuração do Dark Mode
  function setDarkMode(isDark) {
    if (isDark) {
      $('body').addClass('dark-mode');
      $('.kanban-column').addClass('dark-mode-column');
      $('.task-list').addClass('dark-mode-task-list');
      $('.task-card').addClass('dark-mode-task-card');
      $('.new-task-input').addClass('dark-mode-input');
      $('#darkModeToggle i').removeClass('fa-moon').addClass('fa-sun');
      $('#darkModeToggle span').text(' Light Mode');
    } else {
      $('body').removeClass('dark-mode');
      $('.kanban-column').removeClass('dark-mode-column');
      $('.task-list').removeClass('dark-mode-task-list');
      $('.task-card').removeClass('dark-mode-task-card');
      $('.new-task-input').removeClass('dark-mode-input');
      $('#darkModeToggle i').removeClass('fa-sun').addClass('fa-moon');
      $('#darkModeToggle span').text(' Dark Mode');
    }
    localStorage.setItem('kanban-dark-mode', isDark);
  }

  // Inicializar dark mode
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

  // Adicionar nova tarefa
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
          <div>
            <button class="move-task btn btn-sm me-1"><i class="fas fa-arrows-alt-v"></i></button>
            <button class="delete-task btn btn-sm btn-danger">×</button>
          </div>
        </div>
      </div>
    `);
    
    $('#' + columnId).append($task);
    initDraggable($task);
    initDeleteButton($task);
    initMoveButton($task);
  }

  // Inicializar botão de deletar
  function initDeleteButton($element) {
    $element.find('.delete-task').click(function(e) {
      e.stopPropagation();
      $(this).closest('.task-card').remove();
      saveTasks();
    });
  }

  // Inicializar botão de mover (para mobile)
  function initMoveButton($element) {
    $element.find('.move-task').click(function(e) {
      e.stopPropagation();
      const $task = $(this).closest('.task-card');
      showMoveOptions($task);
    });
  }

  // Mostrar opções de movimento (para mobile)
  function showMoveOptions($task) {
    const currentColumn = $task.closest('.task-list').attr('id');
    const taskText = $task.find('.task-content').text();
    
    // Criar modal de opções
    const $modal = $(`
      <div class="modal fade" id="moveModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-body">
              <p>Mover '<strong>${taskText}</strong>' para</p>
              <div class="d-grid gap-2">
                ${currentColumn !== 'to-do' ? '<button class="btn btn-outline-primary move-to-btn" data-target="to-do">📋 To Do</button>' : ''}
                ${currentColumn !== 'doing' ? '<button class="btn btn-outline-primary move-to-btn" data-target="doing">🚀 Doing</button>' : ''}
                ${currentColumn !== 'done' ? '<button class="btn btn-outline-primary move-to-btn" data-target="done">✅ Done</button>' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
    
    $('body').append($modal);
    const modal = new bootstrap.Modal($modal);
    modal.show();
    
    // Configurar botões de movimento
    $('.move-to-btn').click(function() {
      const targetColumn = $(this).data('target');
      $task.detach().appendTo(`#${targetColumn}`);
      saveTasks();
      modal.hide();
      $modal.on('hidden.bs.modal', () => $modal.remove());
    });
    
    $modal.on('hidden.bs.modal', () => $modal.remove());
  }

  // Inicializar arrasto
  function initDraggable($element) {
    $element.draggable({
      revert: "invalid",
      cursor: "move",
      zIndex: 1000,
      containment: ".container",
      helper: function() {
        // Melhor visualização durante arrasto no mobile
        return $(this).clone().css({
          'width': $(this).width(),
          'opacity': '0.8'
        });
      },
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
      initMoveButton($newCard);
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