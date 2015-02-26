/* globals 
  Rooms: true, 
  RoomsController: true,
  comSidebarCurrentWidth: true
*/
Template.communicationSidebarRooms.rendered = function(){

  // initialize maazalik:malihu-jquery-custom-scrollbar scrollbar plugin
  // Desktop Only
  if( comSidebarCurrentWidth >= 992 ){
    $(".communication-sidebar-sleeve").mCustomScrollbar({
  	  	theme:"one-light",
  	  	scrollbarPosition: "inside"
    });
  }

};

Template.communicationSidebarRooms.created = function() {
  Session.set('roomOpenId', null);
};

Template.communicationSidebarRoomsFill.helpers({
  rooms: function() {
    return Rooms.find({
      roomType: 'room'
    });
  },
  unreadMessages: function() {
    var roomCount = RoomsController.getUnreadMessagesCount(this._id);
    return (roomCount > 0) ? roomCount : false;
  }
});