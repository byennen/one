
slideRight = 
  in: (node, next) ->
    $node = $(node)
    $.Velocity.hook($node, "translateX", "100%");
    $node.insertBefore(next)
      .velocity {translateX: ['0%', '100%']},
        duration: 500
        easing: 'ease-in-out'
        queue: false
  out: (node) ->
    $node = $(node)
    $node.velocity {translateX: '-100%'},
      duration: 500
      easing: 'ease-in-out'
      queue: false
      complete: -> 
        $node.remove()

slideLeft = 
  in: (node, next) ->
    $node = $(node)
    $.Velocity.hook($node, "translateX", "-100%");
    $node.insertBefore(next)
      .velocity {translateX: ['0%', '-100%']},
        duration: 500
        easing: 'ease-in-out'
        queue: false
  out: (node) ->
    $node = $(node)
    $node.velocity {translateX: '100%'},
      duration: 500
      easing: 'ease-in-out'
      queue: false
      complete: -> 
        $node.remove()

slideUp = 
  in: (node, next) ->
    $node = $(node)
    $.Velocity.hook($node, "translateY", "100%");
    $node.insertBefore(next)
      .velocity {translateY: ['0%', '100%']},
        duration: 500
        easing: 'ease-in-out'
        queue: false
  out: (node) ->
    $node = $(node)
    $node.velocity {translateY: '-100%'},
      duration: 500
      easing: 'ease-in-out'
      queue: false
      complete: -> 
        $node.remove()

slideDown = 
  in: (node, next) ->
    $node = $(node)
    $.Velocity.hook($node, "translateY", "-100%");
    $node.insertBefore(next)
      .velocity {translateY: ['0%', '-100%']},
        duration: 500
        easing: 'ease-in-out'
        queue: false
  out: (node) ->
    $node = $(node)
    $node.velocity {translateY: '100%'},
      duration: 500
      easing: 'ease-in-out'
      queue: false
      complete: -> 
        $node.remove()


fade = 
  in: 'transition.fadeIn'
  out: 'transition.fadeOut'


Transitioner.transition
  fromRoute: Routes.LOGIN
  toRoute: Routes.DASHBOARD
  velocityAnimaton: fade

Transitioner.transition
  toRoute: Routes.LOGIN
  fromRoute: Routes.DASHBOARD
  velocityAnimaton: fade


slideRightBetween = [Routes.DASHBOARD, Routes.DIRECTORY, Routes.APPS]

for route in slideRightBetween
  others = _.without slideRightBetween, route
  for other in others
    Transitioner.transition
      fromRoute: route
      toRoute: other
      velocityAnimaton:
        in: 'transition.slideRightIn'
        out: 'transition.slideLeftOut'