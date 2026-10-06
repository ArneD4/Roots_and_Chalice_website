<?php

require __DIR__ . '/../conf/db.php';

// Exacte kopregels van het oorspronkelijke Google Doc (compatibiliteit met de SPA)
$DOC_TITEL = <<<'EOT'
,Roots & Chalice 2026-2027,,,,,,Naam tabblad niet onderaan veranderen aub!,,,,,,
EOT;

$DOC_KOP = <<<'EOT'
Datum script,Maand,Dag,Showtype,"Showtitel
(voor website & mixcloud)","Selector
(niet op site/mixcloud)","Host
(niet op site/mixcloud)","Omschrijving 
voor website/mixcloud","Tags voor website/mc
komma gescheiden","Commentaar
(niet op website/mixcloud)",SOCIALS,FOTO OK? naam = verantwoordelijke,
EOT;

function csvVeld($v){
	$v = (string)$v;
	if($v === ''){
		return '';
	}
	if(preg_match('/[",\r\n]/', $v)){
		return '"' . str_replace('"', '""', $v) . '"';
	}
	return $v;
}

function csvRij($velden){
	return implode(',', array_map('csvVeld', $velden)) . "\r\n";
}

$format = isset($_GET['format']) ? $_GET['format'] : 'json';
$db = planningDB();
$rijen = planningRijen($db);

if($format === 'csv'){
	header('Content-Type: text/csv; charset=utf-8');
	header('Cache-Control: no-cache');
	echo $DOC_TITEL . "\r\n";
	echo $DOC_KOP . "\r\n";
	foreach($rijen as $r){
		echo csvRij(array(
			date('ymd', strtotime($r['datum'])),
			$r['maand'],
			$r['dag'],
			$r['showtype'],
			$r['showtitel'],
			$r['selector'],
			$r['host'],
			$r['omschrijving'],
			$r['tags'],
			$r['commentaar'],
			$r['socials'],
			$r['foto_ok'],
			'',
		));
	}
	exit;
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache');
echo json_encode(array(
	'success' => true,
	'rijen' => $rijen,
), JSON_UNESCAPED_UNICODE);
