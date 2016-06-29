var tabCode = 'changes';  // TEMP

localStorage['history'] = {};


function analyseChanges() {
    var friends=[], followers=[], groups=[];
    // получение списка друзей
    VK.api(
        'friends.get',
        {fields: 'last_seen'},
        function(data) {
            if (is_error(data)) {return}
            friends = data['response']['items'];
        }
    );
    // получение списка подписчиков
    // TODO добавить обход ограничения на получение 1000 подписчиков
    VK.api(
        'users.getFollowers',
        {count: 1000},
        function(data) {
            if (is_error(data)) {return}
            followers = data['response']['items'];
        }
    );
    // получение списка групп
    // TODO добавить обход ограничения на получение 1000 групп
    VK.api(
        'groups.get ',
        {count: 1000},
        function(data) {
            if (is_error(data)) {return}
            groups = data['response']['items'];
        }
    );

    // если нет никакой истории
    if ((localStorage['groups'] = undefined) || (localStorage['groups'].length == 0)) {
        localStorage['groups']['history'][(new Date).getTime()] = groups;
    }
    else {
        
    }
}