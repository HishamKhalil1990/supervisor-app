let whs;
let whsName;
$(document).ready(function () {
    whs = localStorage.getItem("whs")
    whsName = localStorage.getItem("whsName")
    syncData()
    $('#goBackBtu').on('click',()=>{
        const data = `<div><a style="color: white;" href="/Report/whs" id="goWhs">press</a></div>`
        goDirect('goWhs',data)
    });
    $('#goHomeBtu').on('click',()=>{
        goToPage("goChoose")
    });
    // $("#excel").on("click", (e) => {
    //   showModal('waiting3')
    //   $.post(`/Excel/invTranHistReport/${whs}`).then(msg => {
    //     hideModal('waiting3')
    //     if(msg == 'error'){
    //       alert("الرجاء حاول مرة اخرى");
    //       location.reload();
    //     }else if(msg == 'noData'){
    //       alert('لا يوجد تقرير لاستخراج اكسل شيت')
    //     }else{
    //       document.getElementById('exportExcel').href = msg
    //       document.getElementById('exportExcel').click()
    //     }
    //   })
    // });
})

const syncData = () => {
    showModal('waiting2')
    $.get(`/Report/invTranHistData/${whs}`).then(data => {
        if(data != 'error'){
            $('#reportTable').html(data)
            hideModal('waiting2')
        }else{
            $('#reportTable').html("")
            hideModal('waiting2')
            alert("الرجاء حاول مرة اخرى");
        }
    })
}


const showModal = (type) => {
    $("#demo-modal").removeClass("modal");
    $("#demo-modal").addClass("modal-v");
    switch (type) {
      case "submit":
        $(".modal_sendDataBack_container").attr("style", "display:flex;");
        break;
      case "net-error":
        $(".modal_netError_container").attr("style", "display:flex;");
        break;
      case "success":
        $(".modal_success_container").attr("style", "display:flex;");
        break;
      case "noData":
        $(".modal_noData_container").attr("style", "display:flex;");
        break;
      case "waiting2":
        $(".modal_waiting_container2").attr("style", "display:flex;");
        break;
      case "waiting3":
          $(".modal_waiting_container3").attr("style", "display:flex;");
          break;
      case "notes":
        $(".modal_notes_container").attr("style", "display:flex;");
        break;
      default:
        break;
    }
  };
  
  const hideModal = (type) => {
    $("#demo-modal").removeClass("modal-v");
    $("#demo-modal").addClass("modal");
    switch (type) {
      case "submit":
        $(".modal_sendDataBack_container").attr("style", "display:none;");
        break;
      case "net-error":
        $(".modal_netError_container").attr("style", "display:none;");
        break;
      case "success":
        $(".modal_success_container").attr("style", "display:none;");
        break;
      case "noData":
        $(".modal_noData_container").attr("style", "display:none;");
        break;
      case "notes":
        $(".modal_notes_container").attr("style", "display:none;");
        break;
      case "waiting2":
        $(".modal_waiting_container2").attr("style", "display:none;");
        break;
      case "waiting3":
          $(".modal_waiting_container3").attr("style", "display:none;");
          break;
      default:
        break;
    }
  }

  const goToPage = (page) => {
    $.get('/Routing').then(data => {
      $('#body').html(data)
      $(document).ready(function() {
          setTimeout(() => {
              document.getElementById(`${page}`).click();
          },1000)
      })
    });
  }

  const goDirect = (page,data) => {
    $('#body').html(data)
    document.getElementById(`${page}`).click();
  }