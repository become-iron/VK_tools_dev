var apiVersion = '5.53';  // используемая версия API VK
var widthFrame = 630;  // ширина фрейма
var storage = false;  // доступность localstorage

// ИНИЦИАЛИЗАЦИЯ API
$(document).ready(function () {
    // TEMP
    VK.init(on_success, on_fail, apiVersion);
});


function on_success() {
    console.info('MPP. Инициализация API прошла успешно');
    VK.callMethod("scrollSubscribe", false);  // подписка на событие onScroll
    resize_frame();
    // TEMP
    if (tabCode === 'mpp') {
        // получаем список групп юзера
        upd_group_list();
    }
    else if (tabCode === 'changes') {
        analyseChanges();
    }
}


function on_fail() {
    alert('MPP. Произошла ошибка инициализации API. Попробуйте обновить страницу');
    console.error('Произошла ошибка инициализации API');
}


/**
 * Проверка ответа VK API на наличие ошибки и извещение об этом пользователя
 * @param {Object} data - ответ API
 * @param {Object} [data.error] - описание ошибки
 * @return {boolean} наличие ошибки
 */
function is_error(data) {
    // TODO добавить возможность прикрепления сообщения
    // ПРОВЕРКА НА ОШИБКУ
    if (data === undefined) {
        alert('Ошибка получения записей');
        console.error('MPP. Ошибка получения записей');
        // разблокировка кнопки выборки
        $(btnExec).val('Произвести выборку');
        $(btnExec).prop("disabled", false);
        return true;
    }
    else if (data['error'] !== undefined) {
        if (data['error']['error_code'] === 260) {  // не получены ращрешения для приложения
            alert('Ошибка. Дайте приложению необходимые разрешения, затем повторите запроос');
            VK.callMethod("showSettingsBox", 270344);  // запрос разрешений для приложения (аудио, стена, группы)
            return true;
            // TEMP добавить повтор запроса после получения прав?
        }
        var txtError = data['error']['error_code'] + ' ' + data['error']['error_msg'];
        alert('Произошла ошибка: ' + txtError);
        console.error('MPP. Ошибка:', txtError);

        // разблокировка кнопки выборки
        $(btnExec).val('Произвести выборку');
        $(btnExec).prop("disabled", false);
        return true;
    }
    else {return false;}
}


/** Изменение размера фрейма приложения */
function resize_frame() {
    VK.callMethod('resizeWindow', widthFrame, $('.container').height());
}


/** ПРОВЕРКА ПОДДЕРЖКИ БРАУЗЕРОМ WEB STORAGE*/
function supports_storage() {
    try {
        return 'localStorage' in window && window['localStorage'] !== null;
    }
    catch (e) {
        alert('Отсутствует поддержа Web Storage в браузере');
        console.error('Отсутствует поддержа Web Storage в браузере');
        return false;
    }
}


/** ПОЛНАЯ ОЧИСТКА WEB STORAGE */
function clear_storage() {
    sessionStorage.clear();
    console.info('Данные приложения в LocalStorage удалены');
}


/** Разность массивов
 * https://habrahabr.ru/post/248229
 * @param {Array} A
 * @param {Array} B
 * @return {Array}
 */
function diff(A, B) {
    var M = A.length, N = B.length, c = 0, C = [];
    for (var i = 0; i < M; i++)
    {
        var j = 0, k = 0;
        while (B[j] !== A[ i ] && j < N) {j++;}
        while (C[k] !== A[ i ] && k < c) {k++;}
        if (j === N && k === c) {C[c++] = A[ i ];}
    }
    return C;
}


// function api_query(query, params, func) {
//     /* Обёртка для выполнения запроса к API VK
//     Принимает:
//         query (String)
//         params (Object)
//         func (function)
//     */
//     if (func === undefined) {
//         func = function(data) {
//                    if (is_error(data)) {return;}
//                    val = data['response']['items']
//                }
//     }
//     var val;
//     VK.api(
//         query,
//         params,
//         func
//     );
//     return val;
// }


// реализация метода format для строк
// http://stackoverflow.com/a/4673436
if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        } );
    }
}
