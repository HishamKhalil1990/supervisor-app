let page = ""
const goToPage = (page) => {
    $.get('/routing').then(data => {
      $('#body').html(data)
      $(document).ready(function() {
          setTimeout(() => {
              document.getElementById(`${page}`).click();
          },1000)
      })
    });
  }

//   const goDirect = (page,data) => {
//     $('#body').html(data)
//     document.getElementById(`${page}`).click();
//   }

$(document).ready(function() {
    $('#transfer').on('click',()=>{
        console.log('transfer')
        page = 'goTransfer'
        showPage(page)
    })
    $('.netError_denied').on('click',()=>{
        hideModal("net-error")
    });
    $('.netError_accept').on('click',()=>{
        hideModal("net-error")
        showPage(page)
    });
    $('#logoutNavBtu').on('click',()=>{
        console.log('logout')
        $.post("/logout").then((data) => {
            $("#body").html(data);
            $(document).ready(function () {
                document.getElementById("goLogin").click();
            });
        });
    });  
})

const showPage = async (page) => {
    showModal('request') 
    $.post(`/sync/${page}`).then(msg => {
        if(msg == 'error'){
            setTimeout(() => {
                changeModalCont('net-error','request');
            },1000)
        }else if(msg == 'done'){
            setTimeout(() => {
                hideModal('request');
                goToPage(page);
            },1000)
        }
    })
}

const showModal = (type) => {
    $('#demo-modal').removeClass('modal');
    $('#demo-modal').addClass('modal-v');
    switch(type){
        case "request":
            $('.modal_syncData_container').attr('style','display:flex;');
            break;
        case "net-error":
            $('.modal_netError_container').attr('style','display:flex;');
            break;
        // case "soon":
        //     $('.modal_soon_container').attr('style','display:flex;');
        //     break;
        // case "net-error2":
        //     $('.modal_netError_container2').attr('style','display:flex;');
        //     break;
        // case "notFound":
        //     $('.modal_noPOs_container').attr('style','display:flex;');
        //     break;
        // case "submit":
        //     $(".modal_sendDataBack_container").attr("style", "display:flex;");
        //     break;
        // case "net-error3":
        //     $('.modal_netError_container3').attr('style','display:flex;');
        //     break;
        // case "success":
        //     $(".modal_success_container").attr("style", "display:flex;");
        //     break;
        // case "confirm":
        //     $(".modal_confirm_container").attr("style", "display:flex;");
        //     break;
        // case "count":
        //     $(".modal_counting_container").attr("style", "display:flex;");
        //     break;
        // case "net-error4":
        //     $('.modal_netError_container4').attr('style','display:flex;');
        //     break;
        // case "net-error5":
        //     $('.modal_netError_container5').attr('style','display:flex;');
        //     break;
        // case "sendEmail":
        //     $('.modal_request_allowing').attr('style','display:flex;');
        //     break;
        // case "waiting":
        //     $(".modal_waiting_container").attr("style", "display:flex;");
        //     break;
        // case "notAllowed":
        //     $(".modal_notAllowed_container").attr("style", "display:flex;");
        //     break;
        default:
            break;
    }
}

const hideModal = (type) => {
    $('#demo-modal').removeClass('modal-v');
    $('#demo-modal').addClass('modal');
    switch(type){
        case "request":
            $('.modal_syncData_container').attr('style','display:none;');
            break;
        case "net-error":
            $('.modal_netError_container').attr('style','display:none;');
            break;
        // case "soon":
        //     $('.modal_soon_container').attr('style','display:none;');
        //     break;
        // case "net-error2":
        //     $('.modal_netError_container2').attr('style','display:none;');
        //     break;
        // case "notFound":
        //     $('.modal_noPOs_container').attr('style','display:none;');
        //     break;
        // case "submit":
        //     $(".modal_sendDataBack_container").attr("style", "display:none;");
        //     break;
        // case "net-error3":
        //     $('.modal_netError_container3').attr('style','display:none;');
        //     break;
        // case "success":
        //     $(".modal_success_container").attr("style", "display:none;");
        //     break;
        // case "confirm":
        //     $(".modal_confirm_container").attr("style", "display:none;");
        //     break;
        // case "count":
        //     $(".modal_counting_container").attr("style", "display:none;");
        //     break;
        // case "net-error4":
        //     $('.modal_netError_container4').attr('style','display:none;');
        //     break;
        // case "net-error5":
        //     $('.modal_netError_container5').attr('style','display:none;');
        //     break;
        // case "sendEmail":
        //     $('.modal_request_allowing').attr('style','display:none;');
        //     break;
        // case "waiting":
        //     $(".modal_waiting_container").attr("style", "display:none;");
        //     break;
        // case "notAllowed":
        //     $(".modal_notAllowed_container").attr("style", "display:none;");
        //     break;
        default:
            break;
    }
}

const changeModalCont = (newContent,oldConten) => {
    hideModal(oldConten);
    showModal(newContent)
}