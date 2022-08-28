let pageOption = 'countName'
const countNameDiv = `<div id="div" style="display: flex;justify-content: center;align-items: center;"><label style="margin-right: 5px;">رقم التحويل : </label><select style="margin-right: 15px;min-width: 30%;" id="select-0"></select><botton id="send" class="btu"><p class="para">Enter</p></botton></div>`
const buttons  = `<div class="btuLoctaion"><botton id="report" class="btu"><p class="para">Report</p></botton><botton id="submitOrder" class="btu" style="margin-left: 30px;"><p class="para">Submit</p></botton><botton id='close1' class="btu" style="margin-left: 30px;"><p class="para">close</p></botton><botton id='exit' class="btu" style="margin-left: 30px;"><p class="para">Exit</p></botton></div>`
let countName;
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
      goToPage('goTransaction')
    });
    $('#goHomeBtu').on('click',()=>{
        goToPage('goTransaction')
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
            alert('الرجاء اختر اسم الجرد')
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
    $.post(`/Count/Sync/${value}`).then(msg => {
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
    $("#submitOrder").on("click", () => {
      showModal("confirm")
    });
    $(".close_btu").on("click", () => {
      hideModal("confirm");
    });
    $("#report").on("click", (e) => {
    const txt = $("#report p")[0].innerHTML.trim();
    if (txt == "Report") {
        showReport();
    } else {
        showAllReports();
    }
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

const tbodyFunc = (e) => {
    const fullID = e.path[0].id;
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
      save(id, input, previousVal);
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
    const tr = $(`#tr${id}`);
    tr.removeClass("active-input");
    tr.removeClass("semi-active");
    tr.addClass("hide");
    tr.css("background-color", "");
  };

const save = (id, input, previousVal) => {
    const tr = $(`#tr${id}`);
    let value = input.val();
    if (value == "") {
      if (previousVal) {
        setOrderValueZero(id);
      }
      input.val("");
    } else if (value.toString()[0] == "-") {
      if (previousVal) {
        setOrderValueZero(id);
      }
      input.val("");
      alert("يرجى ادخال قيمة صحيحة");
    } else {
      value = trim(value);
      if (value != 0) {
        $.post(`/Count/Save/${id}/${value}`).then((msg) => {
            if (msg == "error") {
              alert(
                "IT خطأ داخلي الرجاء المحاولة مرة اخرى او طلب المساعدة من قسم"
              );
              input.val("");
            } else {
              tr.addClass("active-input");
              tr.removeClass("hide");
              tr.css("background-color", "green");
            }
        });
    } else {
      if (previousVal) {
        setOrderValueZero(id);
      }
      input.val("");
    }
  }
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

const setOrderValueZero = async (id) => {
    $.post(`/Count/Save/${id}/0`).then((msg) => {
      if (msg == "error") {
        alert("IT خطأ داخلي الرجاء المحاولة مرة اخرى او طلب المساعدة من قسم");
      }
    });
  };

  const showTransaction = () => {
    $.get("/Routing").then((data) => {
      $("#body").html(data);
      $(document).ready(function () {
        document.getElementById("goTransaction").click();
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

  const showReport = () => {
    setTimeout(() => {
      $.get(`/Count/Report`).then((results) => {
        if (results == "error") {
          alert("IT خطأ داخلي الرجاء المحاولة مرة اخرى او طلب المساعدة من قسم");
        } else {
          $("#reportDiv").html(results);
          $(document).ready(() => {
            $("#close").on("click", (e) => {
              $("#reportDiv").empty();
            });
          });
        }
      });
    }, 100);
  };

  const tryToSubmit = () => {
    $("body").attr("style", "height:100%");
    showModal("submit");
    $.post(`/Count/Submit/${countName}`).then((msg) => {
      if (msg == "done") {
        setTimeout(() => {
          hideModal("submit");
          $("#tbody").empty();
          $("body").attr("style", "height:100%");
          setTimeout(() => {
            showModal("success");
            setTimeout(() => {
              $("#exit p")[0].innerHTML = "Log out";
              $("#report p")[0].innerHTML = "Sent report";
              hideModal("success");
            }, 1000);
          }, 500);
        }, 1000);
      } else if (msg == "error") {
        setTimeout(() => {
          changeModalCont("net-error3", "submit");
        }, 1000);
      } else if (msg == "no data sent") {
        changeModalCont("noData", "submit");
        setTimeout(() => {
          hideModal("noData");
        }, 1000);
      }
    });
  };

  const showAllReports = () => {
    $.get(`/Count/AllReports/${countName}`).then((results) => {
      if (results == "error") {
        alert("IT خطأ داخلي الرجاء المحاولة مرة اخرى او طلب المساعدة من قسم");
      } else {
        $("#reportDiv").html(results);
        $(document).ready(() => {
          $("#close").on("click", (e) => {
            $("#reportDiv").empty();
          });
        });
      }
    });
  };