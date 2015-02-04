/* globals DocumentSharing: true */

DocumentSharing = {

  shareDocuments: function (documentIds, receiver) {
    var sharedDocumentsIds = [];

    _.forEach(documentIds, function (documentId) {
      var sharedDocumentId = SharedDocuments.insert({
        sharedDocumentId: documentId,
        senderId: Meteor.userId(),
        receiverId: receiver._id,
        receiverEmail: receiver.email
      });
      sharedDocumentsIds.push(sharedDocumentId);
    });

    return sharedDocumentsIds;
  },

  acceptDocument: function (sharedDocumentId) {
    SharedDocuments.update(sharedDocumentId, {$set: {isAccepted: true}});
  },

  sendDocumentsSharedEmail: function (sharedDocuments, receiver) {
    var title = sharedDocuments.length === 1 ?
      'A document' :
      sharedDocuments.length + ' documents';
    title += ' have been shared with you';

    var message = _.map(sharedDocuments, function (sharedDocument) {
      return '* ' + sharedDocument.getShareUrl();
    }).join('\n\n');

    Meteor.call(
      'sendProfileContactEmail',
      receiver.email,
      title,
      'Go One',
      '',
      '',
      '',
      message
    );
  }
};

Meteor.methods({

  shareDocuments: function (documentIds, receiver) {
    check(documentIds, [String]);
    check(receiver, {
      _id: Match.Optional(String),
      email: String
    });

    var sharedDocumentIds = DocumentSharing.shareDocuments(
      documentIds,
      receiver
    );
    var sharedDocuments = SharedDocuments
      .find({_id: {$in: sharedDocumentIds}})
      .fetch();
    DocumentSharing.sendDocumentsSharedEmail(sharedDocuments, receiver);
  }

});

/**
 * Publishes a sharedDocument and its associated file.
 * The publication is secured by the accessToken.
 */
Meteor.publishComposite(
  'sharedDocument',
  function (sharedDocumentId, accessToken) {
    check(sharedDocumentId, String);
    check(accessToken, String);

    return {
      find: function () {
        return SharedDocuments.find({
          _id: sharedDocumentId,
          accessToken: accessToken
        });
      },
      children: [
        {
          find: function (sharedDocument) {
            return Files.find({_id: sharedDocument.sharedDocumentId});
          }
        }
      ]
    };
  }
);
