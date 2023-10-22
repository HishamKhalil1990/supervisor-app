let fatherItemId;
let fatherPreviousVal;

const getItemInTable = (fatherItemCode) => {
    const searchBar = $("#example2_filter").find("label").find("input[type|='search']")
    searchBar.val(fatherItemCode)
    searchBar.focus()
    searchBar.keyup()
    searchBar.keypress()
}

const openChildsForItem = (fatherId,fatherItemCode) => {
    fatherItemId = fatherId
    getItemInTable(fatherItemCode)
    $("#childItemsTable").css("display", "");
}

const saveInputValue = (id,value) => {
    const tr = $(`#tr-${id}`);
    const max = $(`#max-${id}`);
    const maxValue = max[0].innerHTML;
    const input = $(`#input-${id}`);
    const changed = $(`#changed-${id}`)
    const onHand = $(`#onHand-${id}`)[0].innerHTML
    const min = $(`#min-${id}`)[0].innerHTML
    input.val(value)
    changed[0].innerHTML = 'yes'
    tr.addClass("active-input");
    tr.removeClass("hide");
    let usedValue = value
    if(value == ""){
        usedValue = 0
    }
    const color = getColor(id,usedValue,onHand,min,maxValue)
    tr.css("background-color", color);
}

const saveFatherValue = (childPre,childID) => {
    const childInput = $(`#input-${childID}`);
    let childNewValue = childInput.val();
    let childPreValue = childPre
    if(!childNewValue){
        childNewValue = 0
    }
    if(!childPreValue){
        childPreValue = 0
    }
    let changeInValue = parseFloat(childNewValue) - parseFloat(childPreValue)
    let fatherNewValue = parseFloat(fatherPreviousVal) + parseFloat(changeInValue)
    if(fatherNewValue != fatherPreviousVal){
        return saveInputValue(fatherItemId,fatherNewValue)
    }
}

$(function () {
    $(document).ready(function () {
        $("#example2").DataTable();
        $("#example2_filter").css("display", "none");
        $("#closeTable").on('click',() => {
            $("#childItemsTable").css("display", "none");
        })
        try {
            document.getElementById("tbody2").addEventListener("click", (e) => {
              const fullID = e.target.id;
              const arr = fullID.split("-");
              const id = arr[1];
              const fatherInput = $(`#input-${fatherItemId}`);
              const fatherValue = fatherInput.val();
              fatherPreviousVal = fatherValue == ''? 0 : fatherValue;
              inputOrder(id,saveFatherValue);
            });
        } catch (err) {
            console.log(err);
        }
    })
})