var apiVersion = '5.44';
var widthFrame = 630;  // ширина фрейма
var storage = false;


// ИНИЦИАЛИЗАЦИЯ API
$(document).ready(function () {
    // TEMP
    VK.init(on_success, on_fail, apiVersion);
});


function on_success() {
    console.info('MPP. Инициализация API прошла успешно');
    resize_frame();
    // получаем список групп юзера
    VK.api(
        'groups.get',
        {filter: 'groups, publics, events', extended: 1},
        upd_group_list
    );
}


function on_fail() {
    alert('MPP. Произошла ошибка инициализации API. Попробуйте обновить страницу');
    console.error('Произошла ошибка инициализации API');
}


function isError(data) {
    // ПРОВЕРКА НА ОШИБКУ
    if (data['error']) {
        var txtError = data['error']['error_code'] + ' ' + data['error']['error_msg'];
        alert('Произошла ошибка: ' + txtError);
        console.error('MPP. Ошибка:', txtError, data);
        // разблокировка кнопки выборки
        $(btnExec).val('Произвести выборку');
        $(btnExec).prop("disabled", false);
        return true;
    }
    else {return false;}
}


function resize_frame() {
    // изменение размера фрейма
    VK.callMethod('resizeWindow', widthFrame, $("html").height());
}

function supports_storage() {
    // ПРОВЕРКА ПОДДЕРЖКИ БРАУЗЕРОМ WEB STORAGE
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    }
    catch (e) {
        alert('Отсутствует поддержа Web Storage в браузере');
        console.error('Отсутствует поддержа Web Storage в браузере');
        return false;
    }
}


function clear_storage() {
    // ПОЛНАЯ ОЧИСТКА WEB STORAGE
    sessionStorage.clear();
    console.info('История очищена')
}


// реализация метода format для строк
// http://stackoverflow.com/a/4673436
if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}

