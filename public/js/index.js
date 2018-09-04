// Click event for the savenote button
$(document).on("click", "#noteSave", function() {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Update note with post request
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      body: $("#note").val()
    }
  })
    .then(function(data) {
      // Log response
      console.log(data);
      // Empty the notes section
      $("#note").empty();
    });
});