const showTransaction= () => {
  const data = `<div><a style="color: white;" href="/choose" id="goChoose">press</a></div>`
  $('#body').html(data)
    document.getElementById(`goChoose`).click();
}

const validate = (data) => {
  $.ajax({
    type: "POST",
    url: "/validate",
    data: JSON.stringify(data),
    contentType : "application/json",
    dataType: 'json',
  }).then(function(result){
      $("#spinner").hide();
      if(result.msg == 'validate'){
        $("#loginSuccess").show().animate({"opacity":"1", "bottom":"-80px"}, 400);
        setTimeout(showTransaction,1000)
      }else if(result.msg == 'not validate'){
        $("#loginFailed").show().animate({"opacity":"1", "bottom":"-80px"}, 400);
      }else{
        $("#error").show().animate({"opacity":"1", "bottom":"-80px"}, 400);
      }
  })
}

$(document).ready(function() {
  $("#do_login").click(function() { 
    $("#spinner").hide();
    $("#loginSuccess").hide();
    $("#loginFailed").hide();
    $("#error").hide();
     closeLoginInfo();
     $(this).parent().find('span').css("display","none");
     $(this).parent().find('span').removeClass("i-save");
     $(this).parent().find('span').removeClass("i-warning");
     $(this).parent().find('span').removeClass("i-close");
     
      var proceed = true;
      $("#login_form input").each(function(){
          
          if(!$.trim($(this).val())){
              $(this).parent().find('span').addClass("i-warning");
            $(this).parent().find('span').css("display","block");  
              proceed = false;
          }
      });
     
      if(proceed) //everything looks good! proceed...
      {
          $(this).parent().find('span').addClass("i-save");
          $(this).parent().find('span').css("display","block");
          $("#spinner").show().animate({"opacity":"1", "bottom":"-80px"}, 400);
          const data = {
            username  : $('#user').val(),
            password  : $('#pass').val(),
          }
          validate(data)
      }
  });
  
  //reset previously results and hide all message on .keyup()
  $("#login_form input").keyup(function() { 
      $(this).parent().find('span').css("display","none");
  });

openLoginInfo();
setTimeout(closeLoginInfo, 1000);
});

function openLoginInfo() {
  $(document).ready(function(){ 
    $('.b-form').css("opacity","0.01");
    $('.box-form').css("left","-37%");
    $('.box-info').css("right","-37%");
  });
}

function closeLoginInfo() {
  $(document).ready(function(){ 
    $('.b-form').css("opacity","1");
    $('.box-form').css("left","0px");
    $('.box-info').css("right","-5px"); 
  });
}

$(window).on('resize', function(){
    closeLoginInfo();
});
