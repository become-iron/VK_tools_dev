var tabCode = 'mpp';  // TEMP

// элементы страницы
var selGroups = '#groups';
var inpOwner = '#groupID';
var btnExec = '#execute';
var selFilter = '#filter';
var divPosts = "#posts";  // контейнер для постов
var inpCount = '#count';  // количество записи для поиска
var inpCountOut = '#countOut';  // количество записей для вывода
var inpOffset = '#offset';  // смещение записей
var selSort = '#sort';
var chbIsContent = '#isContent';
var btnAddPosts = '#btnAddPosts';

var reLink = /([-a-zA-Z0-9@:%_\+.~#?&\/\/=]{2,256}\.[a-z]{2,4}\b(\/?[-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)?)/gi;  // CHECK

var posts;  // полученные посты
var countOut;  // количество постов на вывод
var typeOfSort;  // тип сортировки
var isContent;  // необходимость вывода прикреплений
var code = '';

var htmlTemplate = {
    postStart:          '<div class="panel panel-default"><div class="list-group">',
    postEnd:            '<p class="list-group-item">' +
                            '<button title="Лайки" class="btn action" type="button" disabled="disabled">' +
                               '<span class="glyphicon glyphicon-heart" aria-hidden="true"></span> {0}' +
                            '</button>' +
                            '<button title="Репосты" class="btn action" type="button" disabled="disabled">' +
                               '<span class="glyphicon glyphicon-bullhorn" aria-hidden="true"></span> {1}' +
                            '</button>' +
                            '<button title="Комментарии" class="btn action" type="button" disabled="disabled">' +
                            '<span class="glyphicon glyphicon-comment" aria-hidden="true"></span> {2}' +
                            '</button>' +
                            '<button title="Скорость" class="btn action" type="button" disabled="disabled">' +
                               '<span class="glyphicon glyphicon-dashboard" aria-hidden="true"></span> {3}' +
                            '</button>' +
                        '</p>' +
                        '<p class="list-group-item">' +
                            '<span title="Дата создания записи" class="action">{4}</span>' +
                            '<a title="Открыть запись в новом окне" class="btn action post-link" href="https://vk.com/wall{5}_{6}" target="_blank" role="button">' +
                                'Перейти к записи' +
                            '</a>' +
                        '</p>' +
                        '</div></div>',
    blockPhotoStart:    '<div class="list-group-item photo-block"><div class="row">',
    blockPhoto:         '<div class="col-xs-2">' +
                            '<a href="{0}" target="_blank"><img src="{1}"></a>' +
                        '</div>',
    blockPhotoEnd:      '</div></div>',
    blockAudioStart:    '<div class="list-group-item">',
    audio:              '<audio src="{0}" controls></audio>',
    blockAudioEnd:      '</div>'
};


function upd_group_list() {
    // ОБНОВЛЕНИЯ СПИСКА ГРУПП В ВЫПАДАЮЩЕМ СПИСКЕ
    $(btnExec).prop("disabled", true);
    var groups;
    VK.api(
        'groups.get',
        {filter: 'groups, publics, events', extended: 1},
        function (data) {
            if (!is_error(data)) {
                groups = data['response']['items'];
                // добавляем группы в выпадающий список
                var options = '';
                $(selGroups).empty();  // очищаем список
                for (var i = 0; i < groups.length; i++) {
                    var group = groups[i];
                    options += '<option value="-{0}">{1}</option>'.format(group['id'], group['name']);
                }
                $(selGroups).append(options);
                $(btnExec).prop("disabled", false);
            }
        }
    );
}


function display_posts() {
    // ВЫВОД ПОСТОВ
    countOut = Number($(inpCountOut).val());
    typeOfSort = $(selSort).val();  // вид сортировки
    isContent = $(chbIsContent).prop("checked");  // необходимость показа прикреплений

    $(divPosts).empty();

    console.log('Записи: ', posts);
    if (posts.length == 0) {
        console.info('MPP. Записей не найдено');
        alert('Записей не найдено');
    }
    else if (!is_error(posts)) {
        // расчёт скорости набора лайков
        var currentTime = new Date().getTime() / 1000;
        for (var i = 0; i < posts.length; i++) {
            // скорость = количество лайков / (текущая дата - дата публикации записи) [1/день]
            posts[i]['speed'] = Number((posts[i]['likes']['count'] / (currentTime - posts[i]['date']) * 86400).toFixed(2));
        }
        // сортировка записей
        // TODO оптимизировать
        if (typeOfSort == 'byLikes') {
            posts.sort(function (a, b) {
                if (a['likes']['count'] < b['likes']['count']) return 1;
                else if (a['likes']['count'] > b['likes']['count']) return -1;
                else return 0;
            });
        }
        else if (typeOfSort == 'byReposts') {
            posts.sort(function (a, b) {
                if (a['reposts']['count'] < b['reposts']['count']) return 1;
                else if (a['reposts']['count'] > b['reposts']['count']) return -1;
                else return 0;
            });
        }
        else if (typeOfSort == 'byComments') {
            // сначала новые
            posts.sort(function (a, b) {
                if (a['comments']['count'] < b['comments']['count']) return 1;
                else if (a['comments']['count'] > b['comments']['count']) return -1;
                else return 0;
            });
        }
        else if (typeOfSort == 'bySpeed') {
            posts.sort(function (a, b) {
                if (a['speed'] < b['speed']) return 1;
                else if (a['speed'] > b['speed']) return -1;
                else return 0;
            });
        }
        else if (typeOfSort == 'byTimeDesc') {
            posts.sort(function (a, b) {
                // сначала новые
                if (a['date'] < b['date']) return 1;
                else if (a['date'] > b['date']) return -1;
                else return 0;
            });
        }
        else if (typeOfSort == 'byTimeAsc') {
            // сначала старые
            posts.sort(function (a, b) {
                if (a['date'] > b['date']) return 1;
                else if (a['date'] < b['date']) return -1;
                else return 0;
            });
        }
        console.log('На вывод: ', posts);

        code = '';
        for (var k = 0; k < countOut; k++) {
            // если постов на вывод больше реального их количества
            if (posts[k] === undefined) {
                break;
            }
            make_post(posts[k]);
        }

        $(divPosts).append($(code));
        if (posts.length > countOut) {
            $(btnAddPosts).css("display", 'inline-block');
        }
    }
    // разблокировка кнопки выборки
    $(btnExec).val('Произвести выборку');
    $(btnExec).prop("disabled", false);
    resize_frame();
}


function make_post(post) {
    /* ГЕНЕРАЦИЯ HTML-КОДА ДЛЯ ПОСТА
    Добавляет HTML-код для вывода постов в глобальную переменную code
    Принимает:
        post (object) - запись*/

    function zfill(val) {
        // ДОПОЛНЕНИЕ ЧИСЛА НУЛЁМ СЛЕВА ПРИ НЕОБХОДИМОСТИ
        val = String(val);
        return (val.length == 1) ? '0' + val : val;
    }

    // составление даты записи
    var date = new Date(post['date'] * 1000);
    date = zfill(date.getDate()) + '.' + zfill(Number(date.getMonth()) + 1) + '.' + date.getFullYear()  + ' ' + zfill(date.getHours()) + ':' + zfill(date.getMinutes());

    // начало записи
    code += htmlTemplate.postStart;
    // если имеется текст
    if (post['text'].length > 0 && isContent) {
        // заменяем ссылке в тексте на реальные, добавляем переносы строк
        var text = post['text']
            .replace(reLink, function(s){
                var str = (/:\/\//.exec(s) === null ? "http://" + s : s );  // CHECK
                return '<a href="'+ str + '">' + s + '</a>';
            })
            .replace(/\n/g, '<br>');
        code +=
            '<p class="list-group-item">' +
            text +
            '</p>'
    }
    // если имеются прикрепления
    // REVIEW
    if (post['attachments'] && isContent) {
        // списки с каждым типом прикреплений
        // TODO другие виды прикреплений
        var listPhoto = post['attachments'].filter( function(attach) {
                return attach.type == 'photo'
            } );
        var listAudio = post['attachments'].filter( function(attach) {
                return attach.type == 'audio'
            } );
        //var listVideo = post['attachments'].filter(function(attach) {
        //return attach.type == 'video'
        //});

        if (listPhoto.length > 0) {
            // console.log('Изображения: ', listPhoto);
            code += htmlTemplate.blockPhotoStart;
            for (var j = 0; j < listPhoto.length; j++) {
                var photo = listPhoto[j]['photo'];
                // поиск версии изображения с наибольшим разрешением
                var linkBigPhoto;
                var resolution = [2560, 1280, 807, 604, 130, 75];  // возможные разрешения
                for (var m = 0; m < resolution.length; m++) {
                    if (photo['photo_' + resolution[m]]) {
                        linkBigPhoto = photo['photo_' + resolution[m]];
                        break;
                    }
                }
                code += htmlTemplate.blockPhoto.format(linkBigPhoto, photo['photo_130'] ? photo['photo_130'] : photo['photo_75']);
            }
            code += htmlTemplate.blockPhotoEnd;
        }
        // TODO все записи могут быть заблокированы/удалены
        if (listAudio.length > 0) {
            // console.log('Аудио: ', listAudio);
            code += htmlTemplate.blockAudioStart;
            for (var q = 0; q < listAudio.length; q++) {
                var audio = listAudio[q]['audio'];
                if (audio['url'] == 0) {continue}  // если не указан url аудиозаписи
                code += htmlTemplate.audio.format(audio['url']);
            }
            code += htmlTemplate.blockAudioEnd;
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
    code += htmlTemplate.postEnd.format(post['likes']['count'],
                                        post['reposts']['count'],
                                        post['comments']['count'],
                                        post['speed'],
                                        date,
                                        post['from_id'],
                                        post['id']);
}


// ПОЛУЧЕНИЕ СПИСКА ЗАПИСЕЙ
$(btnExec).click( function() {
    // блокировка кнопки выборки
    $(btnExec).prop("disabled", true);
    $(btnExec).val('[ обновляется ]');

    var ownerInfo = $(inpOwner).val();
    var count = Number($(inpCount).val());  // количество записей для анализа
    var offset = Number($(inpOffset).val());  // смещение  для выборки записей
    var filter = $(selFilter).val();
    var id = '';
    var domain = '';

    if (ownerInfo.length > 0) {
        // извлечение идентификатора страницы
        // TODO дописать для адресов типа club, public
        if (ownerInfo.search(/^-?[0-9]+$/) != -1) {
            id = ownerInfo;
        }
        else {
            var _ = ownerInfo.search('vk.com/');
            if (_ != -1) {
                domain = ownerInfo.slice(_ + 7);
            }
            else {
                domain = ownerInfo;
            }
        }
    }
    else {
        id = $(selGroups).val();
    }

    // ФОРМИРОВАНИЕ ЗАПРОСА НА ПОЛУЧЕНИЕ ПОСТОВ
    if (count > 100) {
        _ = (id.length > 0) ? ('owner_id: ' + id) : ('domain: "' + domain + '"');
        var query = 'var posts;' +
                    'var offset = ' + offset + ';' +
                    'var tmpParam;' +
                    'var countPosts;' +  // количество записей на стене
                    'var countQuery = 0;' +  // количество выполненных запросов к api (ограничение в 25)
                    'var count = ' + count + ';' +
                    'tmpParam = API.wall.get({' + _ + ', count: 100, offset: offset, filter: "' + filter + '"});' +
                    'posts = tmpParam.items;' +
                    'countPosts = tmpParam.count;' +
                    'if (countPosts <= 100) {' +
                        'return posts;' +
                    '}' +
                    'offset = offset + 100;' +
                    'while(posts.length < count && countQuery < 24) {' +
                        'tmpParam = API.wall.get({' + _ + ', count: 100, offset: offset, filter: "' + filter + '"});' +
                        'posts = posts + tmpParam.items;' +
                        'if (tmpParam.count < 100) {return posts;}' +
                        'countQuery = countQuery + 1;' +
                        'offset = offset + 100;' +
                    '}' +
                    'return posts;';
        // console.log('execute-запрос: ', query);
        VK.api(
            'execute',
            {code: query},
            function(data) {
                posts = data['response'];
                display_posts();
            }
        );
    }
    // else if (count > 2500) {
        // TEMP дописать
    // }
    else {
        var params = (id.length > 0)
                     ? {owner_id: id, count: count, filter: filter, offset: offset}
                     : {domain: domain, count: count, filter: filter, offset: offset};
        VK.api(
            'wall.get',
            params,
            function(data) {
                if (!is_error(data)) {
                    posts = data['response']['items'];
                    display_posts();
                }
            }
        );
    }
});


$(btnAddPosts).click( function () {
    code = '';
    for (var n = 0; n < 10; n++) {
        countOut += 1;
        if (posts.length <= countOut) {
            $(btnAddPosts).css("display", 'none');
            break;
        }
        make_post(posts[countOut]);
    }
    $(divPosts).append(code);
    resize_frame();
});


// очищение поля для ссылки при выборе группы из выпад. списка
$(selGroups).change( function() {
    $(inpOwner).val('');
});
