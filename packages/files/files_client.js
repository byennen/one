FileTools.upload = function (method, file, callback, onProgress, onComplete) {
  // Heavily borrowed from http://stackoverflow.com/a/12378395/230462
  Meteor.call(method, file.name, file.type, function (error, result) {
    if (error) return;

    //callback && callback(null, result);

    var formData = new FormData();
    var key = 'events/' + (new Date()).getTime() + '-' + file.name;
    formData.append('key', result.filePath);
    formData.append('acl', result.acl);
    formData.append('Content-Type', file.type);
    formData.append('AWSAccessKeyId', result.credentials.accessKey);
    formData.append('policy', result.credentials.policy);
    formData.append('signature', result.credentials.signature);

    formData.append('file', file);

    var xhr = new XMLHttpRequest();
    if (onProgress) xhr.upload.addEventListener('progress', onProgress, false);

    //onComplete &&
    //this is the place to add functionalities for a spinner until image is uploaded
    xhr.addEventListener('load', function () {
      if (callback)
        callback(null, result);
    }, false);

    var onError = function (evt) {
      if (callback)
        callback(evt);
    };
    xhr.addEventListener('error', onError, false);
    xhr.addEventListener('abort', onError, false);

    xhr.open('POST', Meteor.settings.public.AWS_BUCKET_URL, true);
    xhr.send(formData);
  });
};
FileTools.deleteStub = function (method, filePath, callback) {
  Meteor.call(method, filePath, function (error, result) {
    if (error) return;

    if (callback)
      callback(null, result);
  });
};
