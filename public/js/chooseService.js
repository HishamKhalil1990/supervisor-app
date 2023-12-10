$(document).ready(() => {
    $('#goBackBtu').on('click',()=>{
        goToPage("goChoose")
    });
    $('#goHomeBtu').on('click',()=>{
        goToPage("goChoose")
    });
})

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