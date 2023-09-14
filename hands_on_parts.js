const Handson_Fields = [
    { 'name': '店名', 'type': 'text' },
    { 'name': '住所', 'type': 'text' },
    { 'name': '電話番号', 'type': 'text' },
    { 'name': '営業時間', 'type': 'text' },
    { 'name': 'ジャンル', 'type': 'select', list: ['飲食', '薬局', '小売', '鮮魚', 'アパレル', 'その他']},
    { 'name': '備考', 'type': 'text' },
];

// メニュー構築
const createMenu = (aDraw) => {
    let div = document.createElement('div');
    div.id = "attributePanel";
    div.style.position = 'absolute';
    div.style.top = '-2px';
    div.style.height = '100vh';
    div.style.width = '250px';
    div.style.padding = '5px';
    div.style.borderStyle = 'solid';
    div.style.borderWidth = '2px';
    div.style.borderColor = '#bbbbbb';
    div.style.backgroundColor = '#dddddd';
    div.style.zIndex = 1002;
    div.style.display = 'none';

    // 保存ボタン
    // let button = document.createElement('input');
    // button.type = 'button';
    // button.value = '保存';
    // button.title = '編集した内容を保存します';
    // - 保存イベント
    // div.appendChild(button);

    // 入力フィールド
    let table = document.createElement("table");
    let tbody = document.createElement("tbody");
    for (let i in Handson_Fields) {
        let tr = document.createElement("tr");
        let td1 = document.createElement('td');
        td1.innerText = Handson_Fields[i].name;
        let td2 = document.createElement('td');
        let iText = createInput(Handson_Fields[i])
        function createInput (aInfo) {
            let result = null;
            if (aInfo.type === 'text') {
                let input_ = document.createElement('input');
                input_.className = 'attribute_value';
                input_.type = aInfo.type;
                result = input_;
            } else if (aInfo.type === 'select') {
                let select_ = document.createElement('select');
                select_.className = 'attribute_value';
                for (let d of aInfo.list) {
                    let option_ = document.createElement("option");
                    option_.value = option_.text = d;
                    select_.appendChild(option_);
                }
                result = select_;
            }
            return result;
        }

        td2.appendChild(iText);
        tr.appendChild(td1);
        tr.appendChild(td2);
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    div.appendChild(table);

    document.body.appendChild(div);


    // 描画をダウンロード
    function downloadTextFile() {
        const text = JSON.stringify(aDraw.getAll(), null, 2); // ダウンロードするテキスト内容
        const filename = "draw_result.geojson"; // ファイル名

        const blob = new Blob([text], { type: 'application/json' }); // Blobを作成
        const url = URL.createObjectURL(blob); // BlobをURLに変換

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click(); // リンクをクリックしてダウンロードをトリガー
        URL.revokeObjectURL(url); // 不要になったURLを解放（メモリリーク防止のため）
        alert('描画した店舗情報をダウンロードします');
    }

    const downloadButton = document.createElement('button');
    downloadButton.textContent = '描画DL';
    downloadButton.style.position = 'absolute';
    downloadButton.style.top = 0;
    downloadButton.style.left = 0;
    downloadButton.style.margin = "10px";
    downloadButton.style.zIndex = 1001;
    downloadButton.title = "描画した店舗情報をgeojsonでダウンロードします";
    downloadButton.addEventListener('click', downloadTextFile);
    document.querySelector("#map").appendChild(downloadButton);
};

// mapbox地図イベント付与(地図選択時に属性一覧を表示)
const appendEditProperties = (aMap, aDraw) => {
    let feature_ = null;
    aMap.on("draw.create", (e) => {
        let div = document.querySelector("#attributePanel");
        div.style.display = '';
        feature_ = e.features[0];
        //    console.log('debug:' + e.features[0]);
    });
    // 編集完了時に保存する
    aMap.on("draw.selectionchange", (e) => {
        if (aDraw.getMode() === aDraw.modes.DRAW_POINT) return;

        let div = document.querySelector("#attributePanel");
        let inputs = document.querySelectorAll('.attribute_value');

        // 選択地物が複数ある＝編集未完
        if (e.features != null && e.features.length > 0) {
            if (Object.keys(e.features[0].properties).length === 0) return; // 生成直後のフロー
            div.style.display = "";
            let id_ = e.features[0].id;
            for (let i = 0; i < inputs.length; i++) {
                let attrName = inputs[i].parentNode.previousSibling.innerText;
                let attrValue = e.features[0].properties[attrName];
                inputs[i].value = attrValue;
            }
            feature_ = e.features[0];
            return;
        }
        // 保存処理
        if (feature_ == null) return;

        div.style.display = 'none';
        let id = feature_.id;

        // データ取得
        for (let i = 0; i < inputs.length; i++) {
            let attrName = inputs[i].parentNode.previousSibling.innerText;
            let attrValue = inputs[i].value;
            aDraw.setFeatureProperty(id, attrName, attrValue);
        }

        // クリア
        for (let i = 0; i < inputs.length; i++) {
            inputs[i].value = '';
        }
        feature_ = null;

        //console.log('debug:' + e.features[0]);
    });
}

// mapbox-gl-draw-cold
// mapbox-gl-draw-hot

const appendPopupEvents = (aMap, aDraw, aLayerID) => {
    // ポップアップ表示イベント(MapboxDraw用)
    const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
    });
    aMap.on('mouseover', aLayerID + ".cold", (e) => {callPopup(e)});
    aMap.on('mouseover', aLayerID + ".hot", (e) => {callPopup(e)});

    function callPopup (e) {
        let id = e.features[0].properties.id;
        let feature = aDraw.get(id);

        const coordinates = feature.geometry.coordinates.slice(); //e.features[0].geometry.coordinates.slice();
        const properties = feature.properties;//e.features[0].properties;
        let text = "<p>経度:" + coordinates[0] + "</p>";
        text += "<p>緯度:" + coordinates[1] + "</p>";
        for (let i in properties) {
            text += `<p>${i}：${properties[i]}</p>`;
        }

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        popup.setLngLat(coordinates)
            .setHTML(text)
            .addTo(map);
    };
    // カーソルイベント(指定レイヤの地物にカーソルが重なった時)
    aMap.on('mouseenter', aLayerID + ".cold", () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    aMap.on('mouseenter', aLayerID + ".hot", () => {
        map.getCanvas().style.cursor = 'pointer';
    });
    // カーソルイベント(レイヤのフィーチャからカーソル外れたとき)
    aMap.on('mouseleave', aLayerID + ".cold", () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
    });
    aMap.on('mouseleave', aLayerID + ".hot", () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
    });
}