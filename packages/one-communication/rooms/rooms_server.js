/* globals Rooms: true, Messages: true */

Meteor.startup(function() {
  //checking if rooms are created for general and for offices
  //if not we create them

  var companyChannels = ['General', 'News', 'Events', 'Training'];
  var officeChannels = ['General', 'Water Cooler', 'Listings', 'Open Houses'];

  //placeholder until we get the real office names
  var officeNames = [
    '233 Opera Road',
    '122 Kansas City',
    '321 Road Street',
    '143 Blocked Road',
    '45 Hempshey St.',
    '33 Office Road',
    '99 NY',
    '18 Venice St.',
    '575 Madisson'
  ];


  _.each(companyChannels, function(item) {
    var room = Rooms.findOne({
      roomName: item,
      roomType: 'company'
    });

    if(room)
      return;

    var context = {
      participants: [],
      roomType: 'company',
      roomName: item,
      roomStatus: 'public'
    };

    RoomsController.createRoom(context);

    });

  _.each(officeNames, function(item, index) {
    _.each(officeChannels, function(channel) {
      var room = Rooms.findOne({
        roomName: channel,
        roomType: 'office',
        officeNo: index + 1
      });

      if(room)
        return;

      var context = {
        participants: [],
        roomType: 'office',
        roomName: channel,
        roomStatus: 'public',
        officeNo: index + 1
      };

      RoomsController.createRoom(context);
      })
    });

});

Meteor.publishComposite('roomData', function(roomId) {
  check(roomId, String);
  return {
    //getting the room
    find: function() {
      return Rooms.find({
        _id: roomId
      });
    },
    children: [
      {
        //getting current room members
        find: function (room) {
          //getting all current participants
          var currentParticipants = _.pluck(room.participants,
            'participantId');
          return Meteor.users.find({
            _id: {
              $in: currentParticipants
            }
          });
        }
      },
      {
        find: function(room) {
          //getting room messages. TODO: add limits
          return Messages.find({
            roomId: room._id
          });
        },
        children: [
          {
            find: function(message) {
              //getting message authors
              return Meteor.users.find({
                _id: message.creatorId
              });
            }
          }
        ]
      }
    ]
  };
});
Meteor.publish('room', function (roomId) {
  check(roomId, String);

  if (! this.userId)
    throw new Meteor.Error(401, "You are not logged in!");

  var room = Rooms.findOne(roomId);

  if (! room){
    this.ready();
  } else {
    return [
    Rooms.findOne(roomId),
    Messages.find({ roomId: roomId }),
    Meteor.users.find({
      _id: {
        $in: _.pluck(room.participants, 'participantId')
      }
    })
    ];
  }
});

Meteor.publishComposite('rooms', function() {
  var self = this;
  return {
    find: function() {
      if(! this.userId)
        return;

      var user = Meteor.users.findOne(self.userId);

      return Rooms.find({
        $or: [
            { 'participants.participantId': self.userId },
            { roomType: 'company' },
            {
              $and: [
                { roomType: 'office' },
                { officeNo: user.profile.officeId }
                ]
            }
            ]

      });
    },
    children: [
      {
        find: function(room) {
          if(room && room.roomType && room.roomType === 'dm') {
            var otherParticipant = _.find(room.participants,
              function(item) {
                return item.participantId !== self.userId;
              });

            if (otherParticipant) {
              return Meteor.users.find(otherParticipant.participantId);
              } else {
                return;
              }
          } else {
            return;
          }
        }
      }
    ]
  }
});
Meteor.methods({
  createRoom: function(context) {
    check(context, {
      participants: [Object],
      roomType: Match.Optional(String),
      roomName: Match.Optional(String),
      roomStatus: Match.Optional(String),
      officeNo: Match.Optional(Number)
    });

    // if(! this.userId)
    //   throw new Meteor.Error(401, "You are not logged in!");

    // if(context.roomType &&
    //     context.roomType === 'office' &&
    //     this.userId) //TODO: check if admin
    //   throw new Meteor.Error(403,
    //     "You are not allowed to create Office channels!");

    context.dateCreated = new Date();

    if(this.userId)
      context.ownerId = this.userId;
    else
      context.ownerId = 'public-room';

    Rooms.insert(context, function(e,r) {
      return(e,r);
    });
  },
  createDMRoom: function(userId) {
    check(userId, String);

    if(! this.userId)
      throw new Meteor.Error(401, "You are not logged in!");

    console.log(this.userId, userId);
    var ifRoomExists = Rooms.findOne({
      roomType: 'dm',
      $and: [
        {'participants.participantId': this.userId},
        {'participants.participantId': userId}
      ]
    });

    console.log(ifRoomExists);

    if (ifRoomExists)
      throw new Meteor.Error(403, "Room already exists!");

    query = {
      participants: [
        {
          participantId: this.userId
        },
        {
          participantId: userId
        }
      ],
      roomType: 'dm',
      roomStatus: 'private',
      dateCreated: new Date(),
      ownerId: this.userId
    };

    return Rooms.insert(query, function(e,r) {
      return(e,r);
    });
  },
  deleteRoom: function(roomId) {
    check(roomId, String);
    //only admins and owners can delete rooms?

    if(! this.userId)
      throw new Meteor.Error(401, "You are not logged in!");

    var room = Rooms.findOne(roomId);

    if (!room)
      throw new Meteor.Error(404, "Room not found!");

    if(this.userId !== room.ownerId) //TODO: check if admin or owner
      throw new Meteor.Error(403,
        "You are not allowed to delete this room!");

    Rooms.remove({
      _id: roomId
    }, function(e, r){
      return (e, r);
    });
  },
  editRoom: function(roomId, context) {
    check(roomId, String);
    check(context, {
      roomType: Match.Optional(String),
      roomName: Match.Optional(String),
      roomStatus: Match.Optional(String)
    });
    //only admins and owners can delete rooms?

    if(! this.userId)
      throw new Meteor.Error(401, "You are not logged in!");

    var room = Rooms.findOne(roomId);

    if (!room)
      throw new Meteor.Error(404, "Room not found!");

    if(this.userId !== room.ownerId) //TODO: check if admin or owner
      throw new Meteor.Error(403,
        "You are not allowed to edit this room!");

    Rooms.update({
      _id: roomId
    },{
      $set: context
    }, function(e, r){
      return (e, r);
    });
  },
  addUserToRoom: function(roomId, userId) {
    check(roomId, String);
    check(userId, String);

    if(! this.userId)
      throw new Meteor.Error(401, "You are not logged in!");

    var room = Rooms.findOne(roomId);

    if (!room)
      throw new Meteor.Error(404, "Room not found!");

    if(room.roomType === 'dm')
      throw new Meteor.Error(404, "You cannot add or remove "+
        " users from a dm room!");

    // if (this.userId !== userId || !this.userId) //TODO: add admin check
    //   throw new Meteor.Error(403,
    //     "You can only add yourself to a room if you are not an admin");

    if (this.userId !== userId) {
      var user = Meteor.users.findOne(userId);

      if (!user)
        throw new Meteor.Error(404, "User does not exist!");
    }

    var participants = {
      participantId: userId,
      dateJoined: new Date()
    };

    Rooms.update({
      _id: roomId,
    }, {
      $addToSet: {
        participants: participants
      }
    }, function(e,r) {
      return (e, r);
    });
  },
  removeUserFromRoom: function(roomId, userId) {
    check(roomId, String);
    check(userId, String);

    if(! this.userId)
      throw new Meteor.Error(401, "You are not logged in!");

    var room = Rooms.findOne(roomId);

    if (!room)
      throw new Meteor.Error(404, "Room not found!");

    if(room.roomType === 'dm')
      throw new Meteor.Error(404, "You cannot add or remove "+
        " users from a dm room!");

    if (! _.find(room.participants, function(item) {
      return item.participantId === userId;
      }))
      throw new Meteor.Error(404, "User is not in that room!");

    // if (!this.userId ||
    //   this.userId !== userId ||
    //   this.userId !== room.ownerId) //TODO: add admin check
    //   throw new Meteor.Error(403,
    //     "You can only remove yourself from a room if you are not an admin");

    if (this.userId !== userId) {
      var user = Meteor.users.findOne(userId);

      if (!user)
        throw new Meteor.Error(404, "User does not exist!");
    }

    Rooms.update({
      _id: roomId,
    }, {
      $pull: {
        participants: {
          participantId: userId
        }
      }
    }, {
      multi: true
    }, function(e,r) {
      return (e, r);
    });
  },
  adjustParticipantsInRoom: function(roomId, participantsArray) {
    check(roomId, String);
    check(participantsArray, [String]);

    var room = Rooms.findOne(roomId);

    if (!room)
      throw new Meteor.Error(404, "Room not found!");

    if(room.roomType === 'dm')
      throw new Meteor.Error(404, "You cannot add or remove "+
        " users from a dm room!");

    var currentParticipants =
      _.pluck(room.participants, 'participantId');

    var toRemove = _.difference(currentParticipants, participantsArray);

    var toAdd = _.difference(participantsArray, currentParticipants);

    _.each(toRemove, function(item) {
      Meteor.call('removeUserFromRoom', roomId, item);
    });

    _.each(toAdd, function(item) {
      Meteor.call('addUserToRoom', roomId, item);
    });
  },
  updateTimestamp: function(roomId) {
    check(roomId, String);
    var room = Rooms.findOne(roomId);
    var userId = this.userId;

    if(! room)
      throw new Meteor.Error(404, "Room not found");

    var currentParticipant = _.find(room.participants, function(item) {
        return (item.participantId === userId);
      });

    if (! currentParticipant && room.roomType !== 'office' &&
      room.roomType !== 'company')
      throw new Meteor.Error(403, 'You are not in this room.');

    Rooms.update({
      _id: roomId,
      'participants.participantId': userId
    }, {
      $set: {
        "participants.$.lastReadTimestamp": new Date()
      }
    }, function(e,r) {
      return (e,r);
    });
  }
});