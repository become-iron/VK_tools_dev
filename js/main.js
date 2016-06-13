// ИНИЦИАЛИЗАЦИЯ API
var apiVersion = '5.44',
    widthFrame = 630,  // ширина фрейма
    storage = false;

$(document).ready(function () {
    VK.init(on_success, on_fail, apiVersion);
});

function on_success() {
    console.log('Инициализация прошла успешно');
    resize_frame();
    // получаем список групп юзера
    VK.api(
        'groups.get',
        {filter: 'groups, publics, events', extended: 1},
        upd_group_list
    )
}

function on_fail() {
    alert('Произошла ошибка инициализации API. Попробуйте обновить страницу');
    console.error('Произошла ошибка инициализации API');
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


