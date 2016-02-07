// элементы страницы
var selGroups = '#groups',
    inpLink = '#link',
    btnExec = 'input#execute',
    selFilter = '#filter',
    //tblPosts = '.list-group',
    tblPosts = "#posts",
    inpCount = '#count',
    inpCountOut = '#countOut',
    inpOffset = '#offset',
    selSort = '#sort';

var reLink = /([-a-zA-Z0-9@:%_\+.~#?&\/\/=]{2,256}\.[a-z]{2,4}\b(\/?[-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)?)/gi;  // CHECK

// ИНИЦИАЛИЗАЦИЯ API
var apiVersion = '5.44';

VK.init(on_success, on_fail, apiVersion);

function on_success() {
    console.log('Инициализация прошла успешно');
    // получаем список групп юзера
    VK.api(
        'groups.get',
        {filter: 'groups, publics, events', extended: 1},
        upd_group_list
    )
}

function on_fail() {
    alert('Произошла ошибка инициализации API');
    console.error('Произошла ошибка инициализации API');
}

function upd_group_list(data) {
    console.log('Группы: ', data);
    if (isError(data)) return;
    var groups = data['response']['items'];
    // добавляем группы в выпадающий список
    var options = '';
    $(selGroups).empty();  // очищаем список
    for (var i = 0; i < groups.length; i++) {
        var group = groups[i];
        options += '<option value="' + group['id'] + '">' + group['name'] + '</option>';
    }
    $(selGroups).append($( options ));
}


// ПОЛУЧЕНИЕ СПИСКА ЗАПИСЕЙ
$(btnExec).click(function() {
    // блокировка кнопки выборки
    $(btnExec).prop("disabled", true);
    $(btnExec).val('[ обновляется ]');
    var link = $(inpLink).val(),
        count = Number($(inpCount).val()),  // количество записей для анализа
        offset = Number($(inpOffset).val()),  // смещение  для выборки записей
        filter = $(selFilter).val(),
        id = link.length > 0 ? link : '-' + $(selGroups).val();
    if (count > 100) {
        var query = 'var posts;' +
            'var offset = ' + offset + ';' +
            'var id = ' + id + ';' +
            'var tmpParam;' +
            'var countPosts;' +  // количество записей на стене
            'var countQuery = 0;' +  // количество выполненных запросов к api (ограничение в 25)
            'var count = ' + count + ';' +
            'tmpParam = API.wall.get({owner_id: id, count: 100, offset: offset, filter: "' + filter + '"});' +
            'posts = tmpParam.items;' +
            'countPosts = tmpParam.count;' +
            'if (countPosts <= 100) {' +
            'return posts;' +
            '}' +
            'offset = offset + 100;' +
            'while(posts.length < count && countQuery < 24) {' +
            'tmpParam = API.wall.get({owner_id: id, count: 100, offset: offset, filter: "' + filter + '"});' +
            'posts = posts + tmpParam.items;' +
            'if (tmpParam.count < 100) {return posts;}' +
            'countQuery = countQuery + 1;' +
            'offset = offset + 100;' +
            '}' +
            'return posts;';
        console.log('execute-запрос: ', query);
        VK.api(
            'execute',
            {code: query},
            function(data) {
                displayPosts(data.response);
            }
        );
    }
    else {
        VK.api(
            'wall.get',
            {owner_id: id, count: count, filter: filter, offset: offset},
            function(data) {
                displayPosts(data.response.items);
            }
        );
    }
});

function displayPosts(posts) {
    // ВЫВОД ПОСТОВ
    var countOut = Number($(inpCountOut).val()),
        typeOfSort = $(selSort).val(),  // вид сортировки
        id = $(inpLink).val();
    // определяем, откуда брать id: из выпадающего списка или поля
    id = id.length > 0 ? id : '-' + $(selGroups).val();
    console.log('Записи: ', posts);
    if (isError(posts)) return;
    $(tblPosts).empty();
    if (posts.length == 0) {
        alert('Записей не найдено');
        return;
    }
    // расчёт скорости набора лайков
    var currentTime= new Date().getTime() / 1000;
    for (var i = 0; i < posts.length; i++) {
        // скорость = количество лайков / (текущая дата - дата публикации записи) [1/день]
        posts[i].speed = Number((posts[i].likes.count / (currentTime - posts[i].date) * 86400).toFixed(2));
    }
    // сортировка записей
    if (typeOfSort == 'byLikes') {
        posts.sort(sortRevByLikes);
    }
    else if (typeOfSort == 'byReposts'){
        posts.sort(sortRevByReposts);
    }
    else if (typeOfSort == 'bySpeed') {
        posts.sort(sortRevBySpeed);
    }
    // выборка записей
    posts = posts.slice(0, countOut);
    console.log('На вывод: ', posts);
    var code = '';
    for (var j = 0; j < posts.length; j++) {
        // составление даты записи
        var date = new Date(posts[j].date * 1000),
            minutes = (String(date.getMinutes()).length == 1) ? '0' + date.getMinutes() :/**/ date.getMinutes();
        date = date.getDate() + '.' + (Number(date.getMonth()) + 1)  + '.' + date.getFullYear()  + ' ' + date.getHours()  + ':' + minutes;
        // начало записи
        code +=
            '<div class="panel panel-default">' +
            '<div class="list-group">';
        // если имеется текст
        if (posts[j].text.length > 0) {
            // заменяем ссылке в тексте на реальные, добавляем переносы строк
            var text = posts[j].text
                .replace(reLink, function(s){
                    var str = (/:\/\//.exec(s) === null ? "http://" + s : s );
                    return '<a href="'+ str + '">' + s + '</a>';
                })
                .replace(/\n/g, '<br>');
            code +=
                '<p class="list-group-item">' +
                    text +
                '</p>'
        }
        // если имеются прикрепления
        if (posts[j].attachments) {
            // списки с каждым типом прикреплений
            // TODO другие виды прикреплений
            var listPhoto = posts[j].attachments.filter(function(attach) {
                return attach.type == 'photo'
                }),
                listAudio = posts[j].attachments.filter(function(attach) {
                return attach.type == 'audio'
                });
                //listVideo = posts[j].attachments.filter(function(attach) {
                //    return attach.type == 'video'
                //});



            if (listPhoto.length > 0) {
                console.log('Изображения: ', listPhoto);
                // начало блока
                code += '<div class="list-group-item"><div class="row">';
                for (var k = 0; k < listPhoto.length; k++) {
                    var photo = listPhoto[k].photo;
                    // поиск самой большой версии изображения
                    var linkBigPhoto;
                    var resolution = [2560, 1280, 807, 604, 130, 75];
                    for (var q = 0; q < resolution.length; q++) {
                        if (photo['photo_' + resolution[q]]) {
                            linkBigPhoto = photo['photo_' + resolution[q]];
                            break;
                        }
                    }
                    code += '<div class="col-xs-2"><a href="' + linkBigPhoto + '" target="_blank"><img src="' + (photo.photo_130 ? photo.photo_130 : photo.photo_75) + '" width="auto" height="75"></a></div>';
                }
                // конец блока
                code += '</div></div>';
            }
            if (listAudio.length > 0) {
                console.log('Аудио: ', listAudio);
                // начало блока
                code += '<div class="list-group-item">';
                for (k = 0; k < listAudio.length; k++) {
                    var audio = listAudio[k].audio;
                    // если не указан url аудиозаписи
                    if (audio.url == 0) {continue}
                    code += '<audio src="' + audio.url + '" controls></audio>';
                }
                // конец блока
                code += '</div>';
            }

            //if (listVideo.length > 0) {
            //    console.log('Видео: ', listVideo);
            //    // начало блока
            //    code += '<div class="list-group-item">';
            //    for (var k = 0; k < listPhoto.length; k++) {
            //        var video = listVideo[k];
            //        code += '<div class="embed-responsive embed-responsive-16by9">' +
            //            '<iframe src="//vk.com/video_ext.php?oid=' + video.video.owner_id + '&id=' + video.video.id + '&hash=' + video.video.access_key + '"></iframe>' +
            //            '</div>';
            //        console.log('<div class="embed-responsive embed-responsive-16by9">' +
            //            '<iframe src="//vk.com/video_ext.php?oid=' + video.video.owner_id + '&id=' + video.video.id + '&hash=' + video.video.access_key + '"></iframe>' +
            //            '</div>');
            //    }
            //    // конец блока
            //    code += '</div>';
            //}

        }
        // конец записи
        code += '<p class="list-group-item">' +
                    '<button title="Мне нравится" class="btn action" type="button" disabled="disabled">' +
                        'Мне нравится <span class="glyphicon glyphicon-heart" aria-hidden="true"></span> ' + posts[j].likes.count +
                    '</button>' +
                    '<button title="Поделиться" class="btn action" type="button" disabled="disabled">' +
                        '<span class="glyphicon glyphicon-bullhorn" aria-hidden="true"></span> ' + posts[j].reposts.count +
                    '</button>' +
                    '<button title="Скорость" class="btn action" type="button" disabled="disabled">' +
                        '<span class="glyphicon glyphicon-dashboard" aria-hidden="true"></span> ' + posts[j].speed +
                    '</button>' +
                    '<span title="Дата создания записи" class="action">' + date + '</span>' +
                    '<a title="Открыть запись в новом окне" class="btn action" href="https://vk.com/wall' + id + '_' + posts[j].id + '" target="_blank" role="button">' +
                        'Перейти к записи' +
                    '</a>' +
                '</p>' +
            '</div>' +
            '</div>';
    }
    $(tblPosts).append($( code ));
    // разблокировка кнопки выборки
    $(btnExec).val('Произвести выборку');
    $(btnExec).prop("disabled", false);
    VK.callMethod('resizeWindow', $("html").width(), $("html").height());  // изменение размера фрейма
}


// очищение поля для ссылки при выборе группы из выпад. списка
$(selGroups).change(function() {
    $(inpLink).val('');
});

function isError(data) {
    // ПРОВЕРКА НА ОШИБКУ
    if (data.error) {
        var txtError = data.error['error_code'] + ' ' + data.error['error_msg'];
        alert('Произошла ошибка: ' + txtError);
        console.error(txtError, data);
        return 1;
    }
    else {return 0}
}

function sortRevByLikes(a, b) {
    if (a.likes.count < b.likes.count) return 1;
    else if (a.likes.count > b.likes.count) return -1;
    else return 0;
}

function sortRevByReposts(a, b) {
if (a.reposts.count < b.reposts.count) return 1;
else if (a.reposts.count > b.reposts.count) return -1;
else return 0;
}

function sortRevBySpeed(a, b) {
    if (a.speed < b.speed) return 1;
    else if (a.speed > b.speed) return -1;
    else return 0;
}
