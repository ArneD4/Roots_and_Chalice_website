<?php

require __DIR__ . '/../conf/db.php';

session_start();

function adminIngelogd(){
	return isset($_SESSION['rcs_admin']);
}

function csrfToken(){
	if(empty($_SESSION['csrf'])){
		$_SESSION['csrf'] = bin2hex(random_bytes(16));
	}
	return $_SESSION['csrf'];
}

function checkCsrf(){
	if(!isset($_POST['csrf']) || !hash_equals($_SESSION['csrf'] ?? '', $_POST['csrf'])){
		http_response_code(403);
		exit('Ongeldige request token.');
	}
}

function escape($v){
	return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8');
}

function hostFoto($naam){
	$naam = trim((string)$naam);
	if($naam === ''){
		return '';
	}
	return 'hosts/' . strtolower(str_replace(' ', '-', $naam)) . '.avif';
}

$maandenKort = array(1=>'jan',2=>'feb',3=>'mrt',4=>'apr',5=>'mei',6=>'jun',7=>'jul',8=>'aug',9=>'sep',10=>'okt',11=>'nov',12=>'dec');
$hosts = array('DJ JP', 'Stefaan', 'Louis', 'Wout', 'Daan', 'Bas');

function getWachtwoordHash($db){
	$result = $db->query("SELECT v FROM config WHERE k = 'admin_pass'");
	$rij = $result ? $result->fetch_row() : null;
	return $rij ? $rij[0] : null;
}

$db = planningDB();

// Aanmelding onthouden (3 maanden): geldig token in cookie => sessie herstellen
if(!adminIngelogd() && isset($_COOKIE['rcs_remember']) && $db){
	$res = $db->query("SELECT v FROM config WHERE k = 'remember_token'");
	$rij = $res ? $res->fetch_row() : null;
	if($rij){
		list($exp, $hash) = explode('|', (string)$rij[0]);
		if(time() < (int)$exp && hash_equals($hash, hash('sha256', (string)$_COOKIE['rcs_remember']))){
			session_regenerate_id(true);
			$_SESSION['rcs_admin'] = true;
		}
		else{
			setcookie('rcs_remember', '', ['expires' => time() - 3600, 'path' => '/']);
		}
	}
}

// Acties
if($_SERVER['REQUEST_METHOD'] === 'POST'){
	checkCsrf();
	$actie = $_POST['actie'] ?? '';
	$isAjax = isset($_SERVER['HTTP_X_AUTOSAVE']);

	if($actie === 'inloggen'){
		$hash = getWachtwoordHash($db);
		if($hash && password_verify($_POST['wachtwoord'] ?? '', $hash)){
			session_regenerate_id(true);
			$_SESSION['rcs_admin'] = true;
			// 3 maanden onthouden
			$token = bin2hex(random_bytes(32));
			$verval = time() + 90 * 24 * 3600;
			$prep = $db->prepare("INSERT INTO config (k, v) VALUES ('remember_token', ?) ON DUPLICATE KEY UPDATE v = VALUES(v)");
			$v = $verval . '|' . hash('sha256', $token);
			$prep->bind_param('s', $v);
			$prep->execute();
			setcookie('rcs_remember', $token, ['expires' => $verval, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax']);
		}
		else{
			// in de session zetten: de redirect is een nieuw request, $fout zou anders verloren gaan
			$_SESSION['bericht'] = array('fout' => 'Onjuist wachtwoord.');
		}
		header('Location: /admin.php');
		exit;
	}

	if($actie === 'uitloggen'){
		$prep = $db ? $db->prepare("DELETE FROM config WHERE k = 'remember_token'") : null;
		if($prep){ $prep->execute(); }
		setcookie('rcs_remember', '', ['expires' => time() - 3600, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax']);
		session_destroy();
		header('Location: /admin.php');
		exit;
	}

	if(!$db || !adminIngelogd()){
		http_response_code(403);
		exit('Niet bevoegd.');
	}

	if($actie === 'opslaan'){
		$id = isset($_POST['id']) && $_POST['id'] !== '' ? (int)$_POST['id'] : 0;
		$datumIn = trim($_POST['datum'] ?? '');
		// Brussels notatie (dd-mm-jjjj); ISO (jjjj-mm-dd) en Nederlandse maandnaam (dd mnd jjjj) worden ook geaccepteerd
		$datum = '';
		$dParsed = DateTime::createFromFormat('d-m-Y', $datumIn);
		if($dParsed === false){
			$dParsed = DateTime::createFromFormat('Y-m-d', $datumIn);
		}
		if($dParsed === false){
			$maandNaam = array_flip($maandenKort);
		if(preg_match('/^(\d{1,3})\s+([A-Za-z]+)\s+(\d{2,4})$/', $datumIn, $m) && isset($maandNaam[strtolower(substr($m[2], 0, 3))])){
			$jaar = strlen($m[3]) === 2 ? '20' . $m[3] : $m[3];
			$dParsed = DateTime::createFromFormat('Y-m-d', $jaar . '-' . str_pad($maandNaam[strtolower(substr($m[2], 0, 3))], 2, '0', STR_PAD_LEFT) . '-' . str_pad((string)(int)$m[1], 2, '0', STR_PAD_LEFT));
		}
		}
		if($dParsed !== false){
			$datum = $dParsed->format('Y-m-d');
		}
		$showtype = trim((string)($_POST['showtype'] ?? ''));
		if($datum === ''){
			$fout = 'Datum ontbreekt of is ongeldig (gebruik dd-mm-jjjj, bijv. 18-08-2026).';
		}
		elseif(!in_array($showtype, array('Selectie', 'Guest', 'Special'), true)){
			$fout = 'Ongeldig type (kies Selectie, Guest of Special).';
		}
		else{
			// maand/dag worden niet meer in de UI bewerkt: bij bijwerken de bestaande waarden behouden
			$bestaand = null;
			if($id > 0){
				$prep2 = $db->prepare("SELECT maand, dag FROM planning WHERE id = ?");
				$prep2->bind_param('i', $id);
				$prep2->execute();
				$bestaand = $prep2->get_result()->fetch_assoc();
			}
			$velden = array(
				'maand' => $bestaand['maand'] ?? '',
				'dag' => $bestaand['dag'] ?? '',
				'showtype' => $showtype,
				'showtitel' => trim($_POST['showtitel'] ?? ''),
				'selector' => trim($_POST['selector'] ?? ''),
				'host' => trim($_POST['host'] ?? ''),
				'omschrijving' => trim($_POST['omschrijving'] ?? ''),
				'tags' => trim($_POST['tags'] ?? ''),
				'commentaar' => trim($_POST['commentaar'] ?? ''),
				'socials' => trim($_POST['socials'] ?? ''),
				'foto_ok' => trim($_POST['foto_ok'] ?? ''),
			);
			$prep = $db->prepare("INSERT INTO planning (datum, maand, dag, showtype, showtitel, selector, host, omschrijving, tags, commentaar, socials, foto_ok)
				VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
				ON DUPLICATE KEY UPDATE maand=VALUES(maand), dag=VALUES(dag), showtype=VALUES(showtype), showtitel=VALUES(showtitel),
				selector=VALUES(selector), host=VALUES(host), omschrijving=VALUES(omschrijving), tags=VALUES(tags),
				commentaar=VALUES(commentaar), socials=VALUES(socials), foto_ok=VALUES(foto_ok)");
			$types = 's' . str_repeat('s', count($velden));
			$args = array(&$types, &$datum);
			foreach(array_keys($velden) as $k){
				$args[] = &$velden[$k];
			}
			if(!call_user_func_array(array($prep, 'bind_param'), $args) || !$prep->execute()){
				$fout = 'Opslaan mislukt: ' . $prep->error;
			}
			else{
				$succes = $id ? 'Bijgewerkt.' : 'Toegevoegd.';
			}
		}
	}

	elseif($actie === 'verwijderen'){
		$id = (int)($_POST['id'] ?? 0);
		$prep = $db->prepare("DELETE FROM planning WHERE id = ?");
		$prep->bind_param('i', $id);
		$prep->execute();
		$succes = 'Verwijderd.';
	}

	elseif($actie === 'wachtwoord'){
		$nieuw = $_POST['nieuw_wachtwoord'] ?? '';
		if(strlen($nieuw) < 8){
			$fout = 'Nieuw wachtwoord moet minstens 8 tekens bevatten.';
		}
		elseif($_POST['bevestig_wachtwoord'] !== $nieuw){
			$fout = 'Bevestiging komt niet overeen.';
		}
		else{
			$hash = password_hash($nieuw, PASSWORD_DEFAULT);
			$prep = $db->prepare("INSERT INTO config (k, v) VALUES ('admin_pass', ?) ON DUPLICATE KEY UPDATE v = VALUES(v)");
			$prep->bind_param('s', $hash);
			$prep->execute();
			$succes = 'Wachtwoord gewijzigd.';
		}
	}

	if(isset($fout) || isset($succes)){
		if($isAjax){
			header('Content-Type: application/json; charset=utf-8');
			echo json_encode(array('succes' => isset($succes), 'bericht' => isset($fout) ? $fout : $succes));
			exit;
		}
		$_SESSION['bericht'] = isset($fout) ? array('fout' => $fout) : array('succes' => $succes);
	}
	header('Location: /admin.php');
	exit;
}

// Weergave
$bericht = isset($_SESSION['bericht']) ? $_SESSION['bericht'] : null;
unset($_SESSION['bericht']);

if(!adminIngelogd()){
	$rijen = null;
}
else{
	$rijen = planningRijen($db);
	// Volgende dinsdag (strikt na de laatste rij) voor de autovulling van een nieuwe rij
	$nextTueIso = null;
	$nextTueKort = null;
	if($rijen){
		$laatste = end($rijen);
		$d = new DateTime($laatste['datum']);
		$diff = (2 - (int)$d->format('N') + 7) % 7;
		if($diff === 0){ $diff = 7; }
		$d->modify('+' . $diff . ' days');
		$nextTueIso = $d->format('Y-m-d');
		$nextTueKort = $d->format('j') . ' ' . $maandenKort[(int)$d->format('n')] . ' ' . $d->format('y');
	}
}

// Kolommen: naam, breedte (px)
$kolommen = array(
	array('datum', 'Datum', 120),
	array('showtype', 'Type', 90),
	array('showtitel', 'Showtitel', 170),
	array('selector', 'Selector', 110),
	array('host', 'Host', 90),
	array('omschrijving', 'Omschrijving', 260),
	array('tags', 'Tags', 130),
	array('commentaar', 'extra info', 130),
	array('socials', 'Socials', 110),
	array('foto_ok', 'Foto ok?', 100),
);

function typeKlasse($showtype){
	$t = strtolower(trim((string)$showtype));
	if(strpos($t, 'selectie') !== false){ return 't-selectie'; }
	if(strpos($t, 'guest') !== false){ return 't-guest'; }
	if(strpos($t, 'special') !== false){ return 't-special'; }
	return '';
}
?>
<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Roots &amp; Chalice — planning</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Doto:wght@700;900&family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
<style>
:root{
	--bg:#182421; --panel:#1f2b27; --panel-2:#22302a; --line:#2e3d36; --line-2:#3c4f46;
	--text:#f5f1e3; --muted:#93a79c;
	--cream:#fff0c8; --orange:#ec8d13; --orange-2:#fdac44;
	--green:#23594b; --green-2:#337161; --red:#d74035;
	--radius:10px;
}
*{box-sizing:border-box}
body{font-family:"Space Grotesk",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;margin:0;background:var(--bg);color:var(--text);font-size:14px;line-height:1.45}
.wrap{max-width:1500px;margin:0 auto;padding:0 16px}
.topbar{background:#101a16;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:10}
.topbar .wrap{display:flex;align-items:center;gap:12px;height:54px}
.topbar .logo{height:24px;width:auto}
.topbar .crumb{color:#7d9187;font-size:13px}
.topbar .spacer{flex:1}
.btn{display:inline-flex;align-items:center;gap:6px;border:1px solid transparent;border-radius:7px;cursor:pointer;font-family:inherit;font-size:13px;font-weight:500;padding:6px 12px;line-height:1.2;transition:filter .12s,background .12s,border-color .12s,color .12s}
.btn:focus{outline:2px solid var(--orange-2);outline-offset:1px}
.btn-primary{background:linear-gradient(0deg,var(--green) 0%,var(--green-2) 100%);color:var(--cream)}
.btn-primary:hover{filter:brightness(1.15)}
.btn-danger{background:transparent;color:#f2b1a9;border-color:var(--red)}
.btn-danger:hover{background:var(--red);color:#fff}
.btn-ghost{background:transparent;color:#cfdad2;border-color:var(--line-2)}
.btn-ghost:hover{background:var(--panel-2);color:var(--text)}
.btn-sm{padding:3px 10px;font-size:12px}
main{padding:16px 0 40px}
.alert{border-radius:var(--radius);padding:10px 14px;margin:0 0 14px;font-size:13.5px;border:1px solid transparent;display:flex;gap:8px;align-items:center}
.alert.succes{background:#20362a;border-color:#2f7d54;color:#a5d6b3}
.alert.fout{background:#33201d;border-color:var(--red);color:#f2b1a9}
.toast{position:fixed;right:16px;bottom:16px;z-index:50;display:flex;align-items:center;gap:8px;background:#1d3329;border:1px solid #2f7d54;color:#a5d6b3;padding:9px 14px;border-radius:9px;font-size:13px;font-weight:500;box-shadow:0 6px 18px rgba(0,0,0,.35);opacity:0;transform:translateY(8px);transition:opacity .18s,transform .18s;pointer-events:none}
.toast.visible{opacity:1;transform:translateY(0)}
.toast .ico{color:#5fce8f;font-weight:700}
@media (max-width:860px){
	.toast{right:12px;bottom:12px;left:12px;justify-content:center}
}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);margin-bottom:16px;overflow:hidden}
.panel-head{display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid var(--line);background:var(--panel-2)}
.panel-head h2{font-size:14px;font-weight:600;margin:0}
.panel-head .hint{color:var(--muted);font-size:12.5px;margin-left:auto}
.table-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;table-layout:fixed}
thead th{background:var(--panel-2);color:#9db3a8;font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;padding:9px 8px;text-align:left;border-bottom:1px solid var(--line)}
thead th:first-child{text-align:right}
tbody td{padding:3px 4px;border-bottom:1px solid #26332d;vertical-align:middle;overflow:hidden}
tbody tr:nth-child(even){background:#1c2724}
tbody tr:hover{background:#24332c}
tbody td input,tbody td textarea{width:100%;border:1px solid transparent;background:transparent;border-radius:6px;padding:4px 7px;font-family:inherit;font-size:12.5px;color:var(--text);transition:border-color .1s,background .1s,box-shadow .1s;overflow:hidden;text-overflow:ellipsis}
tbody td input:hover,tbody td textarea:hover{background:var(--panel-2);border-color:var(--line-2)}
tbody td input:focus,tbody td textarea:focus{background:#141d1a;border-color:var(--orange);box-shadow:0 0 0 3px rgba(236,141,19,.16);outline:0}
tbody td input::placeholder,tbody td textarea::placeholder{color:#5f736a}
tbody td[data-kolom="Datum"] input{text-align:right}
tbody td textarea{resize:vertical;min-height:28px;max-height:220px;overflow-y:auto;white-space:normal}
tbody td select{width:100%;appearance:none;-webkit-appearance:none;border:1px solid transparent;background:transparent url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%2393a79c' stroke-width='1.5' fill='none' stroke-linecap='round'/></svg>") no-repeat right 8px center / 10px 6px;border-radius:6px;padding:4px 24px 4px 8px;font-family:inherit;font-size:12.5px;color:inherit;cursor:pointer;transition:border-color .1s,background-color .1s,box-shadow .1s}
tbody td select:hover{background-color:var(--panel-2);border-color:var(--line-2)}
tbody td select:focus{background-color:#141d1a;border-color:var(--orange);box-shadow:0 0 0 3px rgba(236,141,19,.16);outline:0}
tbody td select option{background:#141d1a;color:var(--text)}
/* host: ronde profielfoto + dropdown */
td.host-cell{display:flex;align-items:center;gap:6px}
td.host-cell .host-photo{width:24px;height:24px;border-radius:50%;object-fit:cover;flex:0 0 auto;background:var(--panel-2)}
td.host-cell select{flex:1;min-width:0;width:auto}
/* tags: kaart-invoer (compact: teller-chip, klikken op de cel = uitklappen) */
td[data-kolom="Tags"] .tags-wrap{display:flex;flex-wrap:wrap;align-items:center;gap:3px;min-height:26px;padding:0 2px;flex:1;min-width:0;cursor:pointer}
td[data-kolom="Tags"] .tag-chip{display:none;align-items:center;background:var(--panel-2);border:1px solid var(--line-2);border-radius:999px;color:var(--cream);font-size:11.5px;line-height:1.35;padding:2px 3px 2px 8px;white-space:nowrap}
td[data-kolom="Tags"] .tag-chip.tag-dup{border-color:var(--orange-2);box-shadow:0 0 0 2px rgba(253,172,68,.25)}
td[data-kolom="Tags"] .tag-x{background:transparent;border:0;color:var(--muted);font-family:inherit;font-size:12px;line-height:1;padding:0 3px;margin-left:2px;border-radius:4px;cursor:pointer}
td[data-kolom="Tags"] .tag-x:hover{color:#f2b1a9;background:rgba(215,64,53,.18)}
td[data-kolom="Tags"] .tags-input{display:none;width:auto;flex:1 1 64px;min-width:58px;padding:3px 7px}
td[data-kolom="Tags"] .tag-count{display:none;background:transparent;border:1px dashed var(--line-2);border-radius:999px;color:var(--muted);font-size:11.5px;line-height:1.35;padding:2px 8px;white-space:nowrap}
td[data-kolom="Tags"]:not(.tags-open) .tag-count{display:inline-block}
td[data-kolom="Tags"].tags-open .tag-chip{display:inline-flex}
td[data-kolom="Tags"].tags-open .tags-input{display:block}
tbody tr.rij-dirty td{background:rgba(0,0,0,.22);box-shadow:inset 0 2px 0 var(--orange),inset 0 -2px 0 var(--orange)}
tbody tr.rij-dirty td:first-child{box-shadow:inset 3px 0 0 var(--orange),inset 0 2px 0 var(--orange),inset 0 -2px 0 var(--orange)}
tbody tr.rij-besig td{opacity:.55}
/* typekleuren */
tr.t-selectie td{background:#2e1f1b}
tr.t-selectie td input,tr.t-selectie td textarea,tr.t-selectie td select{color:#f2b1a9}
tr.t-selectie:hover td{background:#382420}
tr.t-selectie td:first-child{box-shadow:inset 3px 0 0 var(--red)}
tr.t-guest td{background:#1e2f24}
tr.t-guest td input,tr.t-guest td textarea,tr.t-guest td select{color:#a5d6b3}
tr.t-guest:hover td{background:#25382c}
tr.t-guest td:first-child{box-shadow:inset 3px 0 0 #4a9d6e}
tr.t-special td{background:#2e2918}
tr.t-special td input,tr.t-special td textarea,tr.t-special td select{color:#e8cf87}
tr.t-special:hover td{background:#37311d}
tr.t-special td:first-child{box-shadow:inset 3px 0 0 var(--orange)}
tbody tr.rij-opgeslagen td{background:#254234}
tbody tr.rij-opgeslagen:hover td{background:#2a4a3c}
tbody tr.rij-opgeslagen.t-selectie td,tbody tr.rij-opgeslagen.t-guest td,tbody tr.rij-opgeslagen.t-special td{background:#254234}
/* nieuwe rij */
tr.nieuw td{background:#262a1c;border-bottom:1px solid #45402a}
tr.nieuw td input,tr.nieuw td textarea,tr.nieuw td select{background-color:#1f2b27;border-color:var(--line-2)}
tr.nieuw td:first-child{box-shadow:inset 3px 0 0 var(--orange-2)}
tr.nieuw:hover td{background:#2c3021}
.actions-cell{white-space:nowrap;padding-right:0 !important;text-align:right}
td.expand-cell{display:none}
.datum-kort{display:none}
.zoekbalk{padding:10px 14px;border-bottom:1px solid var(--line);background:var(--panel-2)}
.zoekbalk input{width:100%;max-width:340px;padding:7px 12px;border:1px solid var(--line-2);border-radius:8px;background:#141d1a;color:var(--text);font-family:inherit;font-size:13.5px;transition:border-color .1s,box-shadow .1s}
.zoekbalk input:focus{outline:0;border-color:var(--orange);box-shadow:0 0 0 3px rgba(236,141,19,.16)}
.zoekbalk input::placeholder{color:#5f736a}
tr.geen-resultaat td{color:var(--muted);text-align:center;padding:16px;font-size:13px;border:0}
.addbar{padding:10px 14px;border-top:1px solid var(--line)}
/* login */
.loginbox{max-width:380px;margin:8vh auto 0}
.loginbox .panel{padding:24px}
.loginbox h1{font-family:Doto,serif;font-weight:900;font-size:20px;margin:0 0 2px}
.loginbox .sub{color:var(--muted);font-size:13px;margin:0 0 16px}
.field{margin-bottom:12px}
.field label{display:block;font-size:12.5px;font-weight:600;color:var(--muted);margin-bottom:4px}
.field input{width:100%;padding:8px 10px;border:1px solid var(--line-2);border-radius:7px;font-size:14px;background:#141d1a;color:var(--text)}
.field input:focus{outline:0;border-color:var(--orange);box-shadow:0 0 0 3px rgba(236,141,19,.16)}
/* mobiel: compacte rijen (datum + titel), uitschuifbaar per rij */
@media (max-width:860px){
	.wrap{padding:0 10px}
	.topbar .wrap{height:48px;gap:8px}
	.topbar .logo{height:20px;width:auto}
	.topbar .crumb{display:none}
	.panel-head{flex-wrap:wrap}
	.panel-head .hint{width:100%;margin:4px 0 0;font-size:11.5px}
	table{display:block;width:100%;table-layout:auto}
	.table-wrap{overflow:visible}
	thead{display:none}
	tbody{display:block}
	tbody tr{display:flex;flex-wrap:nowrap;border:1px solid var(--line);border-radius:10px;margin:8px 0;overflow:hidden;background:var(--panel)}
	tbody tr.rij-open,tbody tr.nieuw{display:block}
	tbody tr.nieuw{border-color:#45402a}
	tbody tr.rij-dirty{border-color:var(--orange);border-width:2px}
	/* compact: één rij — datum + titel + pijl */
	tbody td{display:none}
	tbody td[data-kolom="Datum"],tbody td[data-kolom="Showtitel"],tbody td.expand-cell{display:flex;align-items:center;gap:8px;padding:10px 12px}
	/* host-foto in de compacte rij (vóór de open-knop), alleen als er een host staat */
	tbody tr:not(.rij-open):not(.nieuw) td.host-cell.has-host{display:flex;align-items:center;justify-content:center;padding:10px 0}
	tbody tr:not(.rij-open):not(.nieuw) td.host-cell.has-host .host-photo{width:28px;height:28px}
	tbody tr:not(.rij-open):not(.nieuw) td.host-cell.has-host select{display:none}
	tbody td[data-kolom="Datum"]{flex:0 0 76px;justify-content:flex-end}
	tbody td[data-kolom="Showtitel"]{flex:1;min-width:0}
	tbody td.expand-cell{flex:0 0 auto;justify-content:center}
	tbody tr:not(.rij-open):not(.nieuw) td[data-kolom="Datum"] input{display:none}
	tbody tr:not(.rij-open):not(.nieuw) td[data-kolom="Datum"] .datum-kort{display:block;font-size:13px;font-weight:600;color:var(--cream);white-space:nowrap}
	tbody td[data-kolom="Datum"] input{flex:0 0 78px;font-size:13px;font-weight:600;color:var(--cream);padding:2px 4px;border-radius:4px}
	tbody td[data-kolom="Showtitel"] input{flex:1;min-width:0;font-size:13.5px;font-weight:500;padding:2px 4px;border-radius:4px}
	.knop-expand{border:1px solid var(--line-2);background:transparent;color:#9db3a8;border-radius:6px;font-size:12px;font-family:inherit;padding:3px 9px;cursor:pointer;line-height:1}
	.knop-expand:hover{color:var(--cream);border-color:var(--orange)}
	.knop-expand::after{content:"\25B8";display:inline-block;transition:transform .15s;transform-origin:center}
	.knop-expand.open::after{transform:rotate(90deg)}
	.knop-expand .knop-label{display:none}
	tbody tr.rij-open .knop-expand{font-size:14px;font-weight:600;padding:9px 18px;color:var(--cream);border-color:var(--orange);border-radius:9px}
	tbody tr.rij-open .knop-expand::after{display:none}
	tbody tr.rij-open .knop-expand .knop-label{display:inline}
	/* open rij of nieuwe rij: volledige kaart */
	tbody tr.rij-open td,tbody tr.nieuw td{display:flex;align-items:center;gap:8px;padding:6px 10px;border-bottom:1px solid #26332d}
	tbody tr.rij-open td:last-child,tbody tr.nieuw td:last-child{border-bottom:0}
	tbody tr.rij-open td::before,tbody tr.nieuw td::before{content:attr(data-kolom);flex:0 0 96px;font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#9db3a8;white-space:nowrap}
	tbody tr.rij-open td input,tbody tr.rij-open td select,tbody tr.rij-open td textarea,tbody tr.nieuw td input,tbody tr.nieuw td select,tbody tr.nieuw td textarea{flex:1;min-width:0;font-size:16px}
	tbody tr.rij-open td[data-kolom="Datum"] input,tbody tr.nieuw td[data-kolom="Datum"] input{flex:0 0 auto;width:110px;font-weight:400;color:var(--text);padding:4px 7px;text-align:right}
	tbody tr.rij-open td[data-kolom="Showtitel"] input,tbody tr.nieuw td[data-kolom="Showtitel"] input{flex:1;font-weight:400}
	tbody tr.rij-open td textarea,tbody tr.nieuw td textarea{max-height:140px}
	tbody tr.rij-open td.actions-cell,tbody tr.nieuw td.actions-cell{justify-content:flex-end;padding:8px 10px}
	tbody tr.rij-open td.actions-cell::before,tbody tr.nieuw td.actions-cell::before{display:none}
	tbody tr.rij-open td.actions-cell .btn,tbody tr.nieuw td.actions-cell .btn{margin-left:6px}
	tbody tr.rij-open td.expand-cell{justify-content:flex-end;padding:8px 10px}
	tbody tr.rij-open td.expand-cell::before{display:none}
}
@media (max-width:520px){
	tbody tr.rij-open td,tbody tr.nieuw td{flex-wrap:wrap}
	tbody tr.rij-open td::before,tbody tr.nieuw td::before{flex-basis:100%;margin-bottom:3px}
	tbody tr.rij-open td.actions-cell,tbody tr.nieuw td.actions-cell{flex-wrap:nowrap;justify-content:flex-start}
	tbody tr.rij-open td.actions-cell .btn,tbody tr.nieuw td.actions-cell .btn{flex:1;justify-content:center}
}
</style>
</head>
<body>

<?php if(!adminIngelogd()): ?>
<div class="loginbox">
<div class="panel">
<h1>Roots &amp; Chalice</h1>
<p class="sub">Planning beheer</p>
<?php if($bericht): ?><div class="alert <?php echo $bericht['fout'] ? 'fout' : 'succes'; ?>"><?php echo escape($bericht['fout'] ?? $bericht['succes']); ?></div><?php endif; ?>
<form method="post" action="/admin.php">
<input type="hidden" name="csrf" value="<?php echo csrfToken(); ?>">
<input type="hidden" name="actie" value="inloggen">
<div class="field">
<label for="w">Wachtwoord</label>
<input type="password" id="w" name="wachtwoord" autofocus>
</div>
<button type="submit" class="btn btn-primary" style="width:100%;justify-content:center">Inloggen</button>
</form>
</div>
</div>
<?php else: ?>

<header class="topbar">
<div class="wrap">
<img src="/logo/horizontal.svg" class="logo" alt="Roots &amp; Chalice">
<span class="crumb">/ planning</span>
<span class="spacer"></span>
<form method="post" action="/admin.php" style="display:flex">
<input type="hidden" name="csrf" value="<?php echo csrfToken(); ?>">
<button type="submit" name="actie" value="uitloggen" class="btn btn-ghost btn-sm">Uitloggen</button>
</form>
</div>
</header>

<main class="wrap">
<?php if($bericht): ?>
<div class="alert <?php echo $bericht['fout'] ? 'fout' : 'succes'; ?>"><?php echo escape($bericht['fout'] ?? $bericht['succes']); ?></div>
<?php endif; ?>

<div class="panel">
<div class="panel-head">
<h2>Planning</h2>
<span class="hint">Cel aanklikken en aanpassen &middot; wijzigingen worden automatisch opgeslagen (ook op Enter) &middot; tags: invoeren en op Enter of komma = kaart &middot; <b>X</b> verwijdert de rij</span>
<button type="button" class="btn btn-ghost btn-sm" id="knop-eerdere">Toon eerdere shows</button>
</div>
<div class="zoekbalk">
<input type="text" id="zoekveld" placeholder="Zoeken in planning&#8230;" autocomplete="off">
</div>
<div class="table-wrap">
<table>
<colgroup>
<col style="width:96px">
<col style="width:7.5%">
<col style="width:15%">
<col style="width:9%">
<col style="width:8%">
<col style="width:24%">
<col style="width:8%">
<col style="width:8.5%">
<col style="width:7.5%">
<col style="width:7%">
<col style="width:118px">
</colgroup>
<thead>
<tr>
<?php foreach($kolommen as $k): ?>
<th><?php echo escape($k[1]); ?></th>
<?php endforeach; ?>
<th>&nbsp;</th>
</tr>
</thead>
<tbody>

<?php
function renderRij($r, $kolommen, $formid, $nieuw = false){
	global $maandenKort, $hosts;
	$datum = (string)($r['datum'] ?? '');
	foreach($kolommen as $k){
		$naam = $k[0];
		$val = escape($r[$naam] ?? '');
		$lbl = 'data-kolom="' . escape($k[1]) . '"';
		if($naam === 'omschrijving'){
			echo '<td ' . $lbl . '><textarea form="' . $formid . '" name="' . $naam . '" rows="1" placeholder="—">' . $val . '</textarea></td>';
		}
		elseif($naam === 'datum'){
			$kort = '';
			$dValKort = '';
			if(preg_match('/^\d{4}-\d{2}-\d{2}$/', $datum)){
				$dt = new DateTime($datum);
				$kort = $dt->format('j') . ' ' . $maandenKort[(int)$dt->format('n')];
				$dValKort = $kort . ' ' . $dt->format('y');
			}
			echo '<td ' . $lbl . ' data-datum="' . $datum . '"><span class="datum-kort">' . $kort . '</span><input form="' . $formid . '" type="text" required name="datum"' . ($nieuw ? ' id="datum-nieuw"' : '') . ' placeholder="dd-mm-jjjj" value="' . escape($dValKort) . '"></td>';
		}
		elseif($naam === 'showtype'){
			$cur = (string)($r[$naam] ?? '');
			echo '<td ' . $lbl . '><select form="' . $formid . '" name="' . $naam . '">';
			foreach(array('Selectie', 'Guest', 'Special') as $t){
				echo '<option value="' . $t . '"' . ($cur === $t ? ' selected' : '') . '>' . $t . '</option>';
			}
			echo '</select></td>';
		}
		elseif($naam === 'host'){
			$cur = (string)($r[$naam] ?? '');
			$foto = in_array($cur, $hosts, true) ? hostFoto($cur) : '';
			$cls = 'class="host-cell' . ($foto !== '' ? ' has-host' : '') . '"';
			echo '<td ' . $lbl . ' ' . $cls . '>';
			if($foto !== ''){
				echo '<img class="host-photo" src="' . $foto . '" alt="" onerror="this.style.display=\'none\'">';
			}
			echo '<select form="' . $formid . '" name="' . $naam . '"><option value="">—</option>';
			foreach($hosts as $h){
				echo '<option value="' . escape($h) . '"' . ($cur === $h ? ' selected' : '') . '>' . escape($h) . '</option>';
			}
			echo '</select></td>';
		}
		elseif($naam === 'tags'){
			echo '<td ' . $lbl . '><input form="' . $formid . '" type="hidden" name="tags" value="' . $val . '"><div class="tags-wrap"><input form="' . $formid . '" type="text" class="tags-input" placeholder="tag" autocomplete="off"></div></td>';
		}
		else{
			echo '<td ' . $lbl . '><input form="' . $formid . '" type="text" name="' . $naam . '" value="' . $val . '"></td>';
		}
	}
	$id = (int)($r['id'] ?? 0);
	if($nieuw){
		echo '<td class="actions-cell"><button form="' . $formid . '" type="submit" name="actie" value="opslaan" class="btn btn-primary btn-sm">+ Toevoegen</button></td>';
	}
	else{
		echo '<td class="actions-cell"><button form="' . $formid . '" type="submit" name="actie" value="verwijderen" class="btn btn-danger btn-sm" onclick="return confirm(\'Deze rij verwijderen?\')">X</button></td>';
		echo '<td class="expand-cell"><button type="button" class="knop-expand" aria-label="Details tonen"><span class="knop-label">&#215; Sluiten</span></button></td>';
	}
}

$formnieuw = 'f' . bin2hex(random_bytes(4));
?>
<?php foreach($rijen as $i => $r):
	$formid = 'f' . (int)$r['id'];
	$rijKlasse = typeKlasse($r['showtype'] ?? '');
	?>
<form id="<?php echo $formid; ?>" method="post" action="/admin.php" style="display:contents">
<input type="hidden" name="csrf" value="<?php echo csrfToken(); ?>">
<input type="hidden" name="id" value="<?php echo (int)$r['id']; ?>">
</form>
<tr class="<?php echo $rijKlasse; ?>" data-rij-id="<?php echo (int)$r['id']; ?>">
<?php renderRij($r, $kolommen, $formid); ?>
</tr>
<?php endforeach; ?>

<form id="<?php echo $formnieuw; ?>" method="post" action="/admin.php" style="display:contents">
<input type="hidden" name="csrf" value="<?php echo csrfToken(); ?>">
<input type="hidden" name="id" value="">
</form>
<tr class="nieuw" id="rij-nieuw" style="display:none">
<?php renderRij(array('id' => 0, 'datum' => $nextTueIso), $kolommen, $formnieuw, true); ?>
</tr>
<tr class="geen-resultaat" style="display:none">
<td colspan="12">Geen rijen gevonden voor deze zoekopdracht.</td>
</tr>

</tbody>
</table>
</div>
<div class="addbar">
<button type="button" class="btn btn-ghost btn-sm" id="btn-nieuw" data-next="<?php echo $nextTueKort; ?>">&#43; Nieuwe show</button>
</div>
</div>
</main>
<?php endif; ?>
<?php if(adminIngelogd()): ?>
<script>
(function(){
	// auto-save: rij opslaan zodra de rij met wijzigingen verlaten wordt
	var csrfWaarde = '';
	var csrfEl = document.querySelector('input[name="csrf"]');
	if(csrfEl){ csrfWaarde = csrfEl.value; }
	function rijIsDirty(tr){
		var dirty = false;
		tr.querySelectorAll('input, textarea, select').forEach(function(el){ if(el.value !== el.dataset.orig){ dirty = true; } });
		return dirty;
	}
	function meldFout(msg){
		var d = document.createElement('div');
		d.className = 'alert fout';
		d.textContent = msg;
		var main = document.querySelector('main');
		if(main){ main.insertBefore(d, main.firstChild); }
		setTimeout(function(){ if(d.parentNode){ d.parentNode.removeChild(d); } }, 6000);
	}
	var toastEl = null, toastTimer = null;
	function meldOpgeslagen(){
		if(!toastEl){
			toastEl = document.createElement('div');
			toastEl.className = 'toast';
			toastEl.setAttribute('role', 'status');
			var ico = document.createElement('span');
			ico.className = 'ico';
			ico.textContent = '\u2713';
			toastEl.appendChild(ico);
			toastEl.appendChild(document.createTextNode('Opgeslagen'));
			document.body.appendChild(toastEl);
		}
		toastEl.classList.add('visible');
		if(toastTimer){ clearTimeout(toastTimer); }
		toastTimer = setTimeout(function(){ toastEl.classList.remove('visible'); }, 2200);
	}
	function slaRijAutomatisch(tr){
		var idEl = tr.querySelector('input[name="id"]');
		// het id-livelt in het (broer-)formelement; data-rij-id op de tr is de fallback
		var id = idEl ? idEl.value : (tr.getAttribute('data-rij-id') || '');
		var data = new URLSearchParams();
		data.append('csrf', csrfWaarde);
		data.append('id', id);
		data.append('actie', 'opslaan');
		tr.querySelectorAll('input[name], textarea[name], select[name]').forEach(function(el){
			if(el.name !== 'id' && el.name !== 'csrf'){ data.append(el.name, el.value); }
		});
		tr.classList.add('rij-besig');
		fetch('/admin.php', {method:'POST', headers:{'X-Autosave':'1','Content-Type':'application/x-www-form-urlencoded'}, body:data.toString(), credentials:'same-origin'})
		.then(function(r){ return r.json(); })
		.then(function(j){
			if(j.succes){
				meldOpgeslagen();
				tr.querySelectorAll('input, textarea, select').forEach(function(el){ el.dataset.orig = el.value; });
				tr.classList.remove('rij-dirty');
				var k = tr.querySelector('.datum-kort');
				var d = tr.querySelector('input[name="datum"]');
				if(k && d){
					var kort = datumKortVan(d.value);
					if(kort){ k.textContent = kort; }
				}
				tr.classList.add('rij-opgeslagen');
				setTimeout(function(){ tr.classList.remove('rij-opgeslagen'); }, 1100);
			}
			else{
				meldFout(j.bericht || 'Opslaan mislukt.');
			}
		})
		.catch(function(){ meldFout('Opslaan mislukt (geen verbinding).'); })
		['finally'](function(){ tr.classList.remove('rij-besig'); });
	}
	// tags: kaart-invoer (hashtags, bijv. #dub #reggae)
	function parseTagLijst(s){
		var uit = [];
		String(s == null ? '' : s).trim().split(',').forEach(function(part){
			part = part.trim();
			if(part === ''){ return; }
			if(part.indexOf('#') !== -1){
				(part.match(/#[^#]+/g) || []).forEach(function(seg){
					var t = seg.replace(/^#+\s*/, '').trim();
					if(t !== ''){ uit.push(t); }
				});
			}
			else{
				uit.push(part);
			}
		});
		var gezien = {}, res = [];
		uit.forEach(function(t){
			var k = t.toLowerCase();
			if(gezien[k]){ return; }
			gezien[k] = true;
			res.push(t);
		});
		return res;
	}
	function initTagsCel(wrap){
		var hidden = wrap.parentNode.querySelector('input[name="tags"]');
		var inp = wrap.querySelector('input.tags-input');
		if(!hidden || !inp){ return; }
		var td = wrap.parentNode;
		var tr = wrap.closest('tr');
		var tags = parseTagLijst(hidden.value);
		var count = document.createElement('span');
		count.className = 'tag-count';
		wrap.appendChild(count);
		wrap.insertBefore(count, inp);
		function updateCount(){
			count.textContent = tags.length === 0 ? '' : (tags.length === 1 ? '1 tag' : tags.length + ' tags');
			count.style.display = tags.length ? '' : 'none';
		}
		function syncHidden(){
			hidden.value = tags.join(', ');
			hidden.dispatchEvent(new Event('input'));
		}
		function render(){
			wrap.querySelectorAll('.tag-chip').forEach(function(c){ wrap.removeChild(c); });
			tags.forEach(function(t, i){
				var chip = document.createElement('span');
				chip.className = 'tag-chip';
				chip.title = t;
				chip.textContent = '#' + t;
				var x = document.createElement('button');
				x.type = 'button';
				x.className = 'tag-x';
				x.textContent = '\u00d7';
				x.title = 'tag verwijderen';
				x.addEventListener('click', function(e){
					e.preventDefault();
					e.stopPropagation();
					// focus EERST naar het invoerveld: als de (gefocusste) ×-knop pas in render()
					// wordt verwijderd, dan valt focus op <body> en klapt het focusout de cel dicht
					inp.focus();
					tags.splice(i, 1);
					syncHidden();
					render();
					// direct opslaan: het focusout van de verwijderde (losgekoppelde) ×-knop bereikt de rij niet
					if(rijIsDirty(tr)){ slaRijAutomatisch(tr); }
				});
				chip.appendChild(x);
				wrap.insertBefore(chip, inp);
			});
			updateCount();
		}
		function addTag(raw){
			var t = String(raw).replace(/^#+\s*/, '').replace(/\s+/g, ' ').trim();
			if(t === ''){ return; }
			var chips = wrap.querySelectorAll('.tag-chip');
			for(var i = 0; i < tags.length; i++){
				if(tags[i].toLowerCase() === t.toLowerCase()){
					if(chips[i]){
						chips[i].classList.add('tag-dup');
						setTimeout(function(){ chips[i].classList.remove('tag-dup'); }, 600);
					}
					return;
				}
			}
			tags.push(t);
			syncHidden();
			render();
		}
		inp.addEventListener('keydown', function(e){
			if(e.key === 'Enter'){
				e.preventDefault();
				e.stopImmediatePropagation();
				var v = inp.value;
				inp.value = '';
				if(v.trim() !== ''){
					addTag(v);
					if(rijIsDirty(tr)){ slaRijAutomatisch(tr); }
				}
			}
			else if(e.key === ','){
				e.preventDefault();
				addTag(inp.value);
				inp.value = '';
			}
			else if(e.key === 'Backspace' && inp.value === '' && tags.length > 0){
				tags.pop();
				syncHidden();
				render();
			}
		}, true);
		inp.addEventListener('blur', function(){
			if(inp.value.trim() !== ''){
				addTag(inp.value);
				inp.value = '';
			}
		});
		// cel klikken = uitklappen/kinklappen (× en het invoerveld tellen niet mee)
		td.addEventListener('click', function(e){
			if(e.target === inp || e.target.closest('.tag-x')){ return; }
			var open = td.classList.toggle('tags-open');
			if(open){ inp.focus(); }
		});
		// focus verlaat de cel = inklappen
		wrap.addEventListener('focusout', function(e){
			if(!wrap.contains(e.relatedTarget)){ td.classList.remove('tags-open'); }
		});
		render();
	}
	document.querySelectorAll('td[data-kolom="Tags"] .tags-wrap').forEach(function(wrap){
		try{
			initTagsCel(wrap);
		}
		catch(err){
			console.error('tags-cel initialiseren mislukt', err);
		}
	});
	// klik buiten een tags-cel = alle open tags-cellen inklappen
	document.addEventListener('click', function(e){
		document.querySelectorAll('td[data-kolom="Tags"].tags-open').forEach(function(td){
			if(!td.contains(e.target)){ td.classList.remove('tags-open'); }
		});
	});
	document.querySelectorAll('tbody tr').forEach(function(tr){
		if(tr.classList.contains('nieuw') || tr.classList.contains('geen-resultaat')){ return; }
		var cells = tr.querySelectorAll('input, textarea, select');
		cells.forEach(function(el){ el.dataset.orig = el.value; });
		function check(){
			var dirty = false;
			cells.forEach(function(el){ if(el.value !== el.dataset.orig){ dirty = true; } });
			tr.classList.toggle('rij-dirty', dirty);
		}
		cells.forEach(function(el){
			el.addEventListener('input', check);
			el.addEventListener('change', check);
			if(el.tagName === 'TEXTAREA'){ return; }
			el.addEventListener('keydown', function(e){
				if(e.key === 'Enter'){
					e.preventDefault();
					if(rijIsDirty(tr)){ slaRijAutomatisch(tr); }
					el.blur();
				}
			});
		});
		tr.addEventListener('focusout', function(){
			setTimeout(function(){
				if(!tr.classList.contains('rij-besig') && !tr.contains(document.activeElement) && rijIsDirty(tr)){
					slaRijAutomatisch(tr);
				}
			}, 80);
		});
	});
	// compacte rij uitschuiven (mobiel)
	document.querySelectorAll('.knop-expand').forEach(function(btn){
		btn.addEventListener('click', function(){
			var tr = btn.closest('tr');
			if(!tr){ return; }
			var open = tr.classList.toggle('rij-open');
			btn.classList.toggle('open', open);
			btn.setAttribute('aria-label', open ? 'Details sluiten' : 'Details tonen');
			// mobiel: focus gaat naar een knop IN de rij, dus de focusout-autosave triggert niet meer;
			// bij wijzigingen direct opslaan (in beide richtingen)
			if(rijIsDirty(tr)){ slaRijAutomatisch(tr); }
		});
	});
	// zichtbaarheid: voorbije shows verborgen (tot "Toon eerdere shows"), plus zoekbalk
	var eerdereGeladen = false;
	var qHuidig = '';
	function vandaagISO(){
		var d = new Date();
		var p = function(n){ return (n < 10 ? '0' : '') + n; };
		return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
	}
	function rijDatumISO(tr){
		var td = tr.querySelector('td[data-datum]');
		return td ? td.getAttribute('data-datum') : '';
	}
	function toonRijen(){
		var vandaag = vandaagISO();
		var q = qHuidig.trim().toLowerCase();
		var totaal = 0;
		document.querySelectorAll('tbody tr').forEach(function(tr){
			if(tr.classList.contains('nieuw') || tr.classList.contains('geen-resultaat')){ return; }
			var tekst = '';
			tr.querySelectorAll('input, textarea, select').forEach(function(el){ tekst += ' ' + el.value; });
			var k = tr.querySelector('.datum-kort');
			if(k){ tekst += ' ' + k.textContent; }
			var match = q === '' || tekst.toLowerCase().indexOf(q) !== -1;
			if(match){ totaal++; }
			var iso = rijDatumISO(tr);
			var verstreken = iso !== '' && iso < vandaag;
			var toon = match && (!verstreken || eerdereGeladen);
			tr.style.display = toon ? '' : 'none';
		});
		var nieuw = document.getElementById('rij-nieuw');
		if(nieuw){ nieuw.style.display = (q === '' && nieuw.dataset.open) ? '' : 'none'; }
		var geen = document.querySelector('tr.geen-resultaat');
		if(geen){ geen.style.display = (q !== '' && totaal === 0) ? '' : 'none'; }
	}
	var zoek = document.getElementById('zoekveld');
	if(zoek){
		zoek.addEventListener('input', function(){
			qHuidig = zoek.value;
			toonRijen();
		});
	}
	var knopEerdere = document.getElementById('knop-eerdere');
	if(knopEerdere){
		knopEerdere.addEventListener('click', function(){
			eerdereGeladen = true;
			knopEerdere.style.display = 'none';
			toonRijen();
		});
	}
	toonRijen();
	// datum invoeren in de oude notatie (dd-mm-jjjj) zodra erop geklikt wordt
	var maandNaamJs = {jan:1,feb:2,mrt:3,apr:4,mei:5,jun:6,jul:7,aug:8,sep:9,okt:10,nov:11,dec:12};
	var maandKortJs = ['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec'];
	function datumKortVan(v){
		var m = v.match(/^(\d{1,3})-(\d{1,3})-(\d{4})$/);
		if(m && parseInt(m[2],10) >= 1 && parseInt(m[2],10) <= 12){ return parseInt(m[1],10) + ' ' + maandKortJs[parseInt(m[2],10)-1]; }
		m = v.match(/^(\d{1,3})\s+([a-z]{3,9})\s+\d{2,4}$/i);
		if(m){ return parseInt(m[1],10) + ' ' + m[2]; }
		return '';
	}
	function naarOud(v){
		var m = v.match(/^(\d{1,3})\s+([a-z]{3,9})\s+(\d{2,4})$/i);
		if(!m){ return null; }
		var md = maandNaamJs[m[2].toLowerCase().substr(0,3)];
		if(!md){ return null; }
		var y = m[3];
		if(y.length === 2){ y = '20' + y; }
		var p = function(n){ var i = parseInt(n, 10); return (i < 10 ? '0' : '') + i; };
		return p(m[1]) + '-' + p(md) + '-' + y;
	}
	function naarKort(v){
		var m = v.match(/^(\d{1,3})-(\d{1,3})-(\d{4})$/);
		if(!m || parseInt(m[2],10) < 1 || parseInt(m[2],10) > 12){ return null; }
		return parseInt(m[1],10) + ' ' + maandKortJs[parseInt(m[2],10)-1] + ' ' + m[3].substr(-2);
	}
	document.querySelectorAll('input[name="datum"]').forEach(function(inp){
		inp.addEventListener('focus', function(){
			var oud = naarOud(inp.value);
			if(oud){ inp.value = oud; }
		});
		inp.addEventListener('blur', function(){
			var kort = naarKort(inp.value);
			if(kort){ inp.value = kort; }
		});
	});
	// host: profielfoto live bijwerken zodra de host verandert
	var hostSlug = function(n){ return 'hosts/' + String(n).trim().toLowerCase().replace(/ /g, '-') + '.avif'; };
	document.querySelectorAll('td.host-cell select').forEach(function(sel){
		sel.addEventListener('change', function(){
			var td = sel.closest('td.host-cell');
			if(!td){ return; }
			var foto = sel.value ? hostSlug(sel.value) : '';
			var img = td.querySelector('.host-photo');
			if(foto === ''){
				if(img){ img.style.display = 'none'; }
				td.classList.remove('has-host');
			}
			else{
				if(!img){
					img = document.createElement('img');
					img.className = 'host-photo';
					img.onerror = function(){ this.style.display = 'none'; };
					td.insertBefore(img, sel);
				}
				img.src = foto;
				img.style.display = '';
				td.classList.add('has-host');
			}
		});
	});
	// "+ Nieuwe show": toon de lege rij onderin en vul de datum in met de volgende dinsdag
	var btnNieuw = document.getElementById('btn-nieuw');
	var rijNieuw = document.getElementById('rij-nieuw');
	if(btnNieuw && rijNieuw){
		btnNieuw.addEventListener('click', function(){
			rijNieuw.style.display = '';
			rijNieuw.dataset.open = '1';
			var d = document.getElementById('datum-nieuw');
			if(d && btnNieuw.dataset.next){
				d.value = btnNieuw.dataset.next;
				d.dataset.orig = d.value;
			}
			rijNieuw.scrollIntoView({behavior:'smooth', block:'center'});
			var titel = rijNieuw.querySelector('input[name="showtitel"]');
			if(titel){ titel.focus(); }
		});
	}
})();
</script>
<?php endif; ?>
</body>
</html>
