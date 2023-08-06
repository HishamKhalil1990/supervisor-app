let pageOption = 'countName'
const countNameDiv = `<div id="div" style="display: flex;justify-content: center;align-items: center;"><label style="margin-right: 5px;">رقم الطلب : </label><select style="margin-right: 15px;min-width: 30%;" id="select-0"></select><botton id="send" class="btu"><p class="para">Enter</p></botton></div>`
const buttons  = `<div class="btuLoctaion"><botton id="decline" class="btu"><p class="para">Decline</p></botton><botton id="approve" class="btu" style="margin-left: 30px;"><p class="para">Approve</p></botton><botton id='close1' class="btu" style="margin-left: 30px;"><p class="para">close</p></botton><botton id='exit' class="btu" style="margin-left: 30px;"><p class="para">Exit</p></botton></div>`
let countName;
let reqStatus;
let closeOrder;
$(document).ready(() => {
    showCountName() 
    $('.netError_accept2').on('click',()=>{
        hideModal("net-error2")
        const countNameValue = $('#select-0').val()
        if(countNameValue != ""){
            showTable(countNameValue)
        }else{
          alert('الرجاء ادخال رقم الطلبية')
        }
    });
    $(".confirm_btu").on("click", () => {
      hideModal("confirm");
      setTimeout(() => {
        tryToSubmit();
      }, 100);
    });
    $(".netError_accept3").on("click", () => {
      hideModal("net-error3");
      tryToSubmit();
    });
    $('#goBackBtu').on('click',()=>{
      goToPage('goChoose')
    });
    $('#goHomeBtu').on('click',()=>{
        goToPage('goChoose')
    });  
})

const showCountName = () => {
  $.get('/gencodes').then((data) => {
    if(data != 'error'){
      pageOption = 'countName'
      document.getElementById('receiptDucNo').innerHTML = countNameDiv
      const opts = getOptions(data)
      $('#select-0').html(opts)
      $('#send').on('click',() => {
          const countNameValue = $('#select-0').val()
          if(countNameValue != ""){
              showTable(countNameValue)
          }else{
            alert('الرجاء اختر رقم التحويل')
          }
      })
    }else{
      document.getElementById('receiptDucNo').innerHTML = countNameDiv
      $('#select-0').html(`<option></option`)
      alert("خطأ داخلي الرجاء المحاولة مرة اخرى");
    }
  })   
}

const getOptions = (data) => {
  let opts = ""
  data.forEach((rec) => {
    opts += `<option>${rec.GenCode}</option>`
  })
  return opts
}

const showTable = async (value) => {
    showModal('request') 
    $.post(`/table/${value}`).then(msg => {
        if(msg == 'error'){
            setTimeout(() => {
                changeModalCont('net-error2','request');
            },1000)
        }else{
            setTimeout(() => {
                if(msg != 'not found'){
                    countName = value
                    createTable(msg)
                    hideModal('request');
                }else{
                    changeModalCont('notFound','request');
                    setTimeout(() => {
                        hideModal('notFound')
                    },1500)
                }
            },1000)
        }
    })
}

const closeTable = () => {
    const tableDiv = $('#receiptTable');
    const btuDiv = $('.otterDiv');
    try {
      document.getElementById("tbody").removeEventListener("click", tbodyFunc);
    } catch (err) {
        console.log(err);
    }
    tableDiv.empty();
    btuDiv.empty();
    showCountName() 
}

const createTable = (table) => {
    pageOption = 'countTable'
    const poDiv = $('#receiptDucNo');
    const tableDiv = $('#receiptTable');
    const btuDiv = $('.otterDiv');
    poDiv.empty();
    tableDiv.html(table);
    $("#example").DataTable();
    btuDiv.html(buttons);
    try {
      document.getElementById("tbody").addEventListener("click", tbodyFunc);
    } catch (err) {
        console.log(err);
    }
    $("#approve").on("click", () => {
      reqStatus = 'approve'
      showModal("confirm")
    });
    $(".close_btu").on("click", () => {
      hideModal("confirm");
    });
    $("#decline").on("click", (e) => {
      reqStatus = 'decline'
      showModal("confirm")
    });
    $(".netError_denied3").on("click", () => {
        hideModal("net-error3");
    });
    $("#exit").on("click", (e) => {
        const txt = $("#exit p")[0].innerHTML.trim();
        if (txt == "Exit") {
        showTransaction();
        } else {
        logOut();
        }
    });
    $("#close1").on("click", (e) => {
        closeTable()
    });
}

const showTransaction = () => {
  $.get("/Routing").then((data) => {
    $("#body").html(data);
    $(document).ready(function () {
      document.getElementById("goChoose").click();
    });
  });
};

const logOut = () => {
  $.post("/LogOut").then((data) => {
    $("#body").html(data);
    $(document).ready(function () {
      document.getElementById("goLogin").click();
    });
  });
};

const tryToSubmit = () => {
  $("body").attr("style", "height:100%");
  showModal("submit");
  $.post(`/submit/${reqStatus}/${countName}`).then((msg) => {
    if (msg == "done") {
      setTimeout(() => {
        hideModal("submit");
        $("#tbody").empty();
        $("body").attr("style", "height:100%");
        setTimeout(() => {
          showModal("success");
          $("#exit p")[0].innerHTML = "Log Out"
          $("#approve").off("click");
          $("#decline").off("click",);
          setTimeout(() => {
            hideModal("success");
          }, 1000);
        }, 500);
      }, 1000);
    } else if (msg == "error") {
      setTimeout(() => {
        changeModalCont("net-error3", "submit");
      }, 1000);
    }
  });
};

const tbodyFunc = (e) => {
  const fullID = e.target.id;
  const arr = fullID.split("-");
  const id = arr[1];
  inputOrder(id);
}

const inputOrder = (id) => {
  $(`#input-${id}`).focus();
  const input = $(`#input-${id}`);
  const value = input.val();
  let previousVal = false;
  if (value > 0) {
    previousVal = true;
    edit(id);
  }
  $(`#input-${id}`).on("blur", () => {
    save(id, input, previousVal,value);
    input.off("blur");
    document.getElementById(`input-${id}`).removeEventListener('keydown',tabFunc)
  });
  const tabFunc = (e) => {
    if(e.key == 'Tab'){
        setTimeout(() => {
          const active = document.querySelector(":focus")
          active.click()
        },100)
    }
  }
  document.getElementById(`input-${id}`).addEventListener('keydown',tabFunc)
};

const edit = (id) => {
    const tr = $(`#tr-${id}`);
    tr.removeClass("active-input");
    tr.removeClass("semi-active");
    tr.addClass("hide");
    tr.css("background-color", "");
};

const getColor = (id,usedValue,onHand,min,max) => {
  const changed = $(`#changed-${id}`)[0].innerHTML
  const color = $(`#color-${id}`)
  if(changed != 'yes'){
    if(parseFloat(usedValue) + parseFloat(onHand) > parseFloat(max)){
      color[0].innerHTML = 'red'
      return 'rgb(255, 38, 0)'
    }else if(parseFloat(usedValue) + parseFloat(onHand) < parseFloat(min)){
      color[0].innerHTML = 'blue'
      return 'rgb(0, 153, 255)'
    }else{
      color[0].innerHTML = 'green'
      return 'green'
    }
  }else{
    color[0].innerHTML = 'yellow'
    return '#ffc107'
  }
}

const save = (id, input, previousVal,lastValue) => {
  const tr = $(`#tr-${id}`);
  const changed = $(`#changed-${id}`)
  console.log(changed)
  const onHand = $(`#onHand-${id}`)[0].innerHTML
  const min = $(`#min-${id}`)[0].innerHTML
  const max = $(`#max-${id}`)[0].innerHTML
  let value = input.val();
  let usedValue = value
  if((lastValue == value) && (value != "")){
    usedValue = value
  }else if (value == "") {
    if (previousVal) {
      setOrderValueZero(id);
      changed[0].innerHTML = 'yes'
      tr.addClass("active-input");
      tr.removeClass("hide");
      const color = getColor(id,usedValue,onHand,min,max)
      tr.css("background-color", color);
    }
    usedValue = 0
  } else if (value.toString()[0] == "-") {
    if (previousVal) {
      input.val(lastValue);
    }
    usedValue = lastValue
    alert("ينبغي تحديد كمية الطلب قبل الحفظ");
  } else {
    value = trim(value);
    if (value != 0) {
        const multi = checkMulti(value, id);
        if (multi) {
            $.post(`/Save/${id}/${value}`).then((msg) => {
              if (msg == "error") {
                  alert(
                  "IT خطأ داخلي الرجاء المحاولة مرة اخرى او طلب المساعدة من قسم"
                  );
                  input.val(lastValue);
                  usedValue = lastValue
              }else{
                changed[0].innerHTML = 'yes'
                usedValue = value
                tr.addClass("active-input");
                tr.removeClass("hide");
                const color = getColor(id,usedValue,onHand,min,max)
                tr.css("background-color", color);
              }
            });
        } else {
            const conv = $(`#conv${id}`)[0].innerHTML;
            const uom = $(`#uom-${id}`)[0].innerHTML;
            closeOrder = getCloseOrder(value,conv)
            alert(`الكمية يجب ان تكون من مضاعفات (${conv} ${uom}) اقرب كمية هي ${closeOrder}`);
            input.val(lastValue);
            usedValue = lastValue
        }
    } else {
        if (previousVal) {
          changed[0].innerHTML = 'yes'
          setOrderValueZero(id);
        }
        usedValue = 0
    }
  }
  tr.addClass("active-input");
  tr.removeClass("hide");
  const color = getColor(id,usedValue,onHand,min,max)
  tr.css("background-color", color);
  return;
};

const trim = (value) => {
  const str = value.toString();
  const arr = str.split(".");
  let leftStr = arr[0];
  leftStr = parseInt(leftStr);
  leftStr = leftStr.toString();
  let newStr = arr[1] ? `${leftStr}.${arr[1]}` : `${leftStr}`;
  return parseFloat(newStr);
};

const checkMulti = (value, id) => {
  const conv = $(`#conv${id}`)[0].innerHTML != 0 ? $(`#conv${id}`)[0].innerHTML : value;
  if (value % conv == 0) {
    return true;
  } else {
    closeOrder = getCloseOrder(value,conv)
    if(closeOrder == value){
      return true
    }else{
      return false;
    }
  }
};

const getCloseOrder = (value,conValue) => {
  const firstClose = value + (conValue - value % conValue)
  let seconClose;
  if(value > conValue){
    seconClose = value - (value % conValue)
  }else{
    seconClose = firstClose
  }
  if(seconClose < 0){
    seconClose = firstClose
  }
  return Math.abs(firstClose - value) <= Math.abs(value- seconClose)? firstClose : seconClose
}

const setOrderValueZero = async (id) => {
  $.post(`/Save/${id}/0`).then((msg) => {
    if (msg == "error") {
      alert("IT خطأ داخلي الرجاء المحاولة مرة اخرى او طلب المساعدة من قسم");
    }
  });
};