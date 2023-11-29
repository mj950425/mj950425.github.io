function spread(count){
    var checkbox = document.getElementById('folder-checkbox-' + count);
    checkbox.checked = !checkbox.checked;

    var icon = document.getElementById('spread-icon-' + count);
    icon.innerHTML = icon.innerHTML == 'arrow_right' ? 'arrow_drop_down' : 'arrow_right';
}
