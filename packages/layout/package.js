Package.describe({
  summary: 'Layout templates.'
});

Package.onUse(function (api) {
  api.use([
    'templating', 'authorization', 'less',
    'styles', 'jquery', 'stevezhu:velocity.js@0.1.0',
    'tracker', 'session'
    ], 'web');

  api.addFiles([
    'application.html', 'application_client.js',
    'navbar.html', 'navbar_client.js', 'navbar.less',
    'left_nav.html', 'leftNav.js', 'left_nav_client.js',
    'left_nav.less',

    'notifications.html', 'notifications.less', 'notifications_client.js'
    ], 'web');
  
});
