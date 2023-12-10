const select = `<select name="warehouse" id="selectWhs"></select>`
const spinner = `<div id="spinnerOutter"><div id="spinnerInner" ><div class="lds-ring"><div></div><div></div><div></div><div></div></div></div></div>` 

const getOptions = (data) => {
    let opts = ''
    data.forEach(opt => {
        opts += `<option id=${opt.WhsCode}>${opt.WhsName}</option>`
    })
    return opts
}

$(document).ready(() => {
    $.get('/warehouses').then((data) => {
        if(data != "error"){
            const opts = getOptions(data)
            $('#selectPlace').html(select)
            $('#selectWhs').html(opts)
        }else{
            $('#selectPlace').empty()
            alert('لم يتم تحديث المستودعات حاول مرة اخرى')
        }
    })
    $('#whsSendBtu').on('click',()=>{
        const option = $('#selectWhs').find(":selected")
        const whs = option[0].id
        const whsName = $('#selectWhs').val()
        if(whs != ""){
            localStorage.setItem("whs",whs);
            localStorage.setItem("whsName",whsName);
            const data = `<div><a style="color: white;" href="/Report/invTranHistReport" id="goReport">press</a></div>`
            goDirect('goReport',data)
        }else{
          alert('الرجاء ادخال رقم المستودع')
        }
    });
    $('#goBackBtu').on('click',()=>{
        const data = `<div><a style="color: white;" href="/Report" id="goReport">press</a></div>`
        goDirect('goReport',data)
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