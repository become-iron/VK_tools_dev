var btnLoadAudio = '#loadAudio';




$(btnLoadAudio).click(function() {

    VK.api(
        'audio.get',
        {filter: 'groups, publics, events', extended: 1},
        function() {

        }
    )
});