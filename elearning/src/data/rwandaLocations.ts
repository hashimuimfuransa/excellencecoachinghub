export interface RwandaLocation {
  name: string;
  districts?: RwandaLocation[];
  sectors?: RwandaLocation[];
  cells?: RwandaLocation[];
}

export const rwandaProvinces: RwandaLocation[] = [
  {
    name: 'Kigali City',
    districts: [
      {
        name: 'Gasabo',
        sectors: [
          { name: 'Bumbogo', cells: [{ name: 'Bumbogo' }, { name: 'Gitega' }, { name: 'Munyiginya' }] },
          { name: 'Gatsata', cells: [{ name: 'Gatsata' }, { name: 'Karuruma' }, { name: 'Rutunga' }] },
          { name: 'Jali', cells: [{ name: 'Jali' }, { name: 'Buregera' }, { name: 'Rushashi' }] },
          { name: 'Gikomero', cells: [{ name: 'Gikomero' }, { name: 'Mukarange' }, { name: 'Rusagara' }] },
          { name: 'Gisozi', cells: [{ name: 'Gisozi' }, { name: 'Duhozanye' }, { name: 'Kajevuba' }] },
          { name: 'Jabana', cells: [{ name: 'Jabana' }, { name: 'Gasanze' }, { name: 'Cyahafi' }] },
          { name: 'Kinyinya', cells: [{ name: 'Kinyinya' }, { name: 'Kagugu' }, { name: 'Kibagabaga' }] },
          { name: 'Ndera', cells: [{ name: 'Ndera' }, { name: 'Busanza' }, { name: 'Rusororo' }] },
          { name: 'Nduba', cells: [{ name: 'Nduba' }, { name: 'Kiruhura' }, { name: 'Rutunga' }] },
          { name: 'Remera', cells: [{ name: 'Remera' }, { name: 'Gisozi' }, { name: 'Rukiri' }] }
        ]
      },
      {
        name: 'Kicukiro',
        sectors: [
          { name: 'Gahanga', cells: [{ name: 'Gahanga' }, { name: 'Akagera' }, { name: 'Shyara' }] },
          { name: 'Gatenga', cells: [{ name: 'Gatenga' }, { name: 'Kagarama' }, { name: 'Kigarama' }] },
          { name: 'Gikondo', cells: [{ name: 'Gikondo' }, { name: 'Nyarugunga' }, { name: 'Rwampara' }] },
          { name: 'Kanombe', cells: [{ name: 'Kanombe' }, { name: 'Busanza' }, { name: 'Nyarugunga' }] },
          { name: 'Kicukiro', cells: [{ name: 'Kicukiro' }, { name: 'Gahanga' }, { name: 'Niboye' }] },
          { name: 'Niboye', cells: [{ name: 'Niboye' }, { name: 'Kagarama' }, { name: 'Nyarugunga' }] }
        ]
      },
      {
        name: 'Nyarugenge',
        sectors: [
          { name: 'Gitega', cells: [{ name: 'Gitega' }, { name: 'Rwezamenyo' }, { name: 'Zindiro' }] },
          { name: 'Kanyinya', cells: [{ name: 'Kanyinya' }, { name: 'Cyahafi' }, { name: 'Rugando' }] },
          { name: 'Kigali', cells: [{ name: 'Ubumwe' }, { name: 'Rwezamenyo' }, { name: 'Nyarugenge' }] },
          { name: 'Kimisagara', cells: [{ name: 'Kimisagara' }, { name: 'Nyamirambo' }, { name: 'Biryogo' }] },
          { name: 'Mageragere', cells: [{ name: 'Mageragere' }, { name: 'Nyamirambo' }, { name: 'Rwezamenyo' }] },
          { name: 'Muhima', cells: [{ name: 'Muhima' }, { name: 'Rugenge' }, { name: 'Nyabugogo' }] },
          { name: 'Nyakabanda', cells: [{ name: 'Nyakabanda' }, { name: 'Biryogo' }, { name: 'Nyamirambo' }] },
          { name: 'Nyamirambo', cells: [{ name: 'Nyamirambo' }, { name: 'Biryogo' }, { name: 'Muhima' }] },
          { name: 'Rwezamenyo', cells: [{ name: 'Rwezamenyo' }, { name: 'Gitega' }, { name: 'Nyarugenge' }] }
        ]
      }
    ]
  },
  {
    name: 'Eastern Province',
    districts: [
      {
        name: 'Bugesera',
        sectors: [
          { name: 'Gashora', cells: [{ name: 'Gashora' }, { name: 'Kamabuye' }, { name: 'Nyamata' }] },
          { name: 'Juru', cells: [{ name: 'Juru' }, { name: 'Rweru' }, { name: 'Sake' }] },
          { name: 'Kamabuye', cells: [{ name: 'Kamabuye' }, { name: 'Gashora' }, { name: 'Nyamata' }] },
          { name: 'Ntarama', cells: [{ name: 'Ntarama' }, { name: 'Zaza' }, { name: 'Rilima' }] },
          { name: 'Nyamata', cells: [{ name: 'Nyamata' }, { name: 'Kamabuye' }, { name: 'Gashora' }] },
          { name: 'Nyarugenge', cells: [{ name: 'Nyarugenge' }, { name: 'Rweru' }, { name: 'Sake' }] },
          { name: 'Rilima', cells: [{ name: 'Rilima' }, { name: 'Ntarama' }, { name: 'Zaza' }] },
          { name: 'Ruhuha', cells: [{ name: 'Ruhuha' }, { name: 'Rweru' }, { name: 'Sake' }] },
          { name: 'Rweru', cells: [{ name: 'Rweru' }, { name: 'Juru' }, { name: 'Sake' }] },
          { name: 'Shyara', cells: [{ name: 'Shyara' }, { name: 'Nyamata' }, { name: 'Gashora' }] }
        ]
      },
      {
        name: 'Gatsibo',
        sectors: [
          { name: 'Gasange', cells: [{ name: 'Gasange' }, { name: 'Rwimbogo' }, { name: 'Kageyo' }] },
          { name: 'Gatsibo', cells: [{ name: 'Gatsibo' }, { name: 'Kageyo' }, { name: 'Rwimbogo' }] },
          { name: 'Gitoki', cells: [{ name: 'Gitoki' }, { name: 'Kageyo' }, { name: 'Rwimbogo' }] },
          { name: 'Kageyo', cells: [{ name: 'Kageyo' }, { name: 'Gasange' }, { name: 'Rwimbogo' }] },
          { name: 'Kabarore', cells: [{ name: 'Kabarore' }, { name: 'Kageyo' }, { name: 'Rwimbogo' }] },
          { name: 'Kiziguro', cells: [{ name: 'Kiziguro' }, { name: 'Kageyo' }, { name: 'Rwimbogo' }] },
          { name: 'Muhura', cells: [{ name: 'Muhura' }, { name: 'Kageyo' }, { name: 'Rwimbogo' }] },
          { name: 'Murambi', cells: [{ name: 'Murambi' }, { name: 'Kageyo' }, { name: 'Rwimbogo' }] },
          { name: 'Nyagihanga', cells: [{ name: 'Nyagihanga' }, { name: 'Kageyo' }, { name: 'Rwimbogo' }] },
          { name: 'Remera', cells: [{ name: 'Remera' }, { name: 'Kageyo' }, { name: 'Rwimbogo' }] },
          { name: 'Rugarama', cells: [{ name: 'Rugarama' }, { name: 'Kageyo' }, { name: 'Rwimbogo' }] },
          { name: 'Rwimbogo', cells: [{ name: 'Rwimbogo' }, { name: 'Gasange' }, { name: 'Kageyo' }] }
        ]
      },
      {
        name: 'Kayonza',
        sectors: [
          { name: 'Gahini', cells: [{ name: 'Gahini' }, { name: 'Rwinkwavu' }, { name: 'Mwiri' }] },
          { name: 'Kabare', cells: [{ name: 'Kabare' }, { name: 'Rwinkwavu' }, { name: 'Mwiri' }] },
          { name: 'Kayonza', cells: [{ name: 'Kayonza' }, { name: 'Rwinkwavu' }, { name: 'Mwiri' }] },
          { name: 'Mukarange', cells: [{ name: 'Mukarange' }, { name: 'Rwinkwavu' }, { name: 'Mwiri' }] },
          { name: 'Murama', cells: [{ name: 'Murama' }, { name: 'Rwinkwavu' }, { name: 'Mwiri' }] },
          { name: 'Murundi', cells: [{ name: 'Murundi' }, { name: 'Rwinkwavu' }, { name: 'Mwiri' }] },
          { name: 'Mwiri', cells: [{ name: 'Mwiri' }, { name: 'Gahini' }, { name: 'Rwinkwavu' }] },
          { name: 'Ndego', cells: [{ name: 'Ndego' }, { name: 'Rwinkwavu' }, { name: 'Mwiri' }] },
          { name: 'Nyamirama', cells: [{ name: 'Nyamirama' }, { name: 'Rwinkwavu' }, { name: 'Mwiri' }] },
          { name: 'Rukara', cells: [{ name: 'Rukara' }, { name: 'Rwinkwavu' }, { name: 'Mwiri' }] },
          { name: 'Rwinkwavu', cells: [{ name: 'Rwinkwavu' }, { name: 'Gahini' }, { name: 'Mwiri' }] }
        ]
      }
    ]
  },
  {
    name: 'Northern Province',
    districts: [
      {
        name: 'Burera',
        sectors: [
          { name: 'Bungwe', cells: [{ name: 'Bungwe' }, { name: 'Cyeru' }, { name: 'Rugando' }] },
          { name: 'Butaro', cells: [{ name: 'Butaro' }, { name: 'Cyeru' }, { name: 'Rugando' }] },
          { name: 'Cyanika', cells: [{ name: 'Cyanika' }, { name: 'Cyeru' }, { name: 'Rugando' }] },
          { name: 'Cyeru', cells: [{ name: 'Cyeru' }, { name: 'Bungwe' }, { name: 'Rugando' }] },
          { name: 'Gahunga', cells: [{ name: 'Gahunga' }, { name: 'Cyeru' }, { name: 'Rugando' }] },
          { name: 'Gatebe', cells: [{ name: 'Gatebe' }, { name: 'Cyeru' }, { name: 'Rugando' }] },
          { name: 'Gitovu', cells: [{ name: 'Gitovu' }, { name: 'Cyeru' }, { name: 'Rugando' }] },
          { name: 'Kagogo', cells: [{ name: 'Kagogo' }, { name: 'Cyeru' }, { name: 'Rugando' }] },
          { name: 'Kinoni', cells: [{ name: 'Kinoni' }, { name: 'Cyeru' }, { name: 'Rugando' }] },
          { name: 'Kinyababa', cells: [{ name: 'Kinyababa' }, { name: 'Cyeru' }, { name: 'Rugando' }] },
          { name: 'Kivuye', cells: [{ name: 'Kivuye' }, { name: 'Cyeru' }, { name: 'Rugando' }] },
          { name: 'Nemba', cells: [{ name: 'Nemba' }, { name: 'Cyeru' }, { name: 'Rugando' }] },
          { name: 'Rugarama', cells: [{ name: 'Rugarama' }, { name: 'Cyeru' }, { name: 'Rugando' }] },
          { name: 'Rugendabari', cells: [{ name: 'Rugendabari' }, { name: 'Cyeru' }, { name: 'Rugando' }] },
          { name: 'Ruhunde', cells: [{ name: 'Ruhunde' }, { name: 'Cyeru' }, { name: 'Rugando' }] },
          { name: 'Rusarabuye', cells: [{ name: 'Rusarabuye' }, { name: 'Cyeru' }, { name: 'Rugando' }] },
          { name: 'Rwerere', cells: [{ name: 'Rwerere' }, { name: 'Cyeru' }, { name: 'Rugando' }] }
        ]
      },
      {
        name: 'Gakenke',
        sectors: [
          { name: 'Busengo', cells: [{ name: 'Busengo' }, { name: 'Rushashi' }, { name: 'Kivuruga' }] },
          { name: 'Cyabingo', cells: [{ name: 'Cyabingo' }, { name: 'Rushashi' }, { name: 'Kivuruga' }] },
          { name: 'Gakenke', cells: [{ name: 'Gakenke' }, { name: 'Rushashi' }, { name: 'Kivuruga' }] },
          { name: 'Gashenyi', cells: [{ name: 'Gashenyi' }, { name: 'Rushashi' }, { name: 'Kivuruga' }] },
          { name: 'Janja', cells: [{ name: 'Janja' }, { name: 'Rushashi' }, { name: 'Kivuruga' }] },
          { name: 'Kamubuga', cells: [{ name: 'Kamubuga' }, { name: 'Rushashi' }, { name: 'Kivuruga' }] },
          { name: 'Karambo', cells: [{ name: 'Karambo' }, { name: 'Rushashi' }, { name: 'Kivuruga' }] },
          { name: 'Kivuruga', cells: [{ name: 'Kivuruga' }, { name: 'Busengo' }, { name: 'Rushashi' }] },
          { name: 'Mataba', cells: [{ name: 'Mataba' }, { name: 'Rushashi' }, { name: 'Kivuruga' }] },
          { name: 'Minazi', cells: [{ name: 'Minazi' }, { name: 'Rushashi' }, { name: 'Kivuruga' }] },
          { name: 'Muhondo', cells: [{ name: 'Muhondo' }, { name: 'Rushashi' }, { name: 'Kivuruga' }] },
          { name: 'Muzo', cells: [{ name: 'Muzo' }, { name: 'Rushashi' }, { name: 'Kivuruga' }] },
          { name: 'Nemba', cells: [{ name: 'Nemba' }, { name: 'Rushashi' }, { name: 'Kivuruga' }] },
          { name: 'Ruli', cells: [{ name: 'Ruli' }, { name: 'Rushashi' }, { name: 'Kivuruga' }] },
          { name: 'Rushaki', cells: [{ name: 'Rushaki' }, { name: 'Rushashi' }, { name: 'Kivuruga' }] },
          { name: 'Rushashi', cells: [{ name: 'Rushashi' }, { name: 'Busengo' }, { name: 'Kivuruga' }] }
        ]
      },
      {
        name: 'Gicumbi',
        sectors: [
          { name: 'Bukure', cells: [{ name: 'Bukure' }, { name: 'Cyumba' }, { name: 'Rubaya' }] },
          { name: 'Bwisige', cells: [{ name: 'Bwisige' }, { name: 'Cyumba' }, { name: 'Rubaya' }] },
          { name: 'Byumba', cells: [{ name: 'Byumba' }, { name: 'Cyumba' }, { name: 'Rubaya' }] },
          { name: 'Cyumba', cells: [{ name: 'Cyumba' }, { name: 'Bukure' }, { name: 'Rubaya' }] },
          { name: 'Gicumbi', cells: [{ name: 'Gicumbi' }, { name: 'Cyumba' }, { name: 'Rubaya' }] },
          { name: 'Kaniga', cells: [{ name: 'Kaniga' }, { name: 'Cyumba' }, { name: 'Rubaya' }] },
          { name: 'Manyagiro', cells: [{ name: 'Manyagiro' }, { name: 'Cyumba' }, { name: 'Rubaya' }] },
          { name: 'Miyove', cells: [{ name: 'Miyove' }, { name: 'Cyumba' }, { name: 'Rubaya' }] },
          { name: 'Mukarange', cells: [{ name: 'Mukarange' }, { name: 'Cyumba' }, { name: 'Rubaya' }] },
          { name: 'Mutete', cells: [{ name: 'Mutete' }, { name: 'Cyumba' }, { name: 'Rubaya' }] },
          { name: 'Nyamiyaga', cells: [{ name: 'Nyamiyaga' }, { name: 'Cyumba' }, { name: 'Rubaya' }] },
          { name: 'Nyankenke', cells: [{ name: 'Nyankenke' }, { name: 'Cyumba' }, { name: 'Rubaya' }] },
          { name: 'Rubaya', cells: [{ name: 'Rubaya' }, { name: 'Bukure' }, { name: 'Cyumba' }] },
          { name: 'Rukomo', cells: [{ name: 'Rukomo' }, { name: 'Cyumba' }, { name: 'Rubaya' }] },
          { name: 'Rushaki', cells: [{ name: 'Rushaki' }, { name: 'Cyumba' }, { name: 'Rubaya' }] },
          { name: 'Rutare', cells: [{ name: 'Rutare' }, { name: 'Cyumba' }, { name: 'Rubaya' }] },
          { name: 'Rwamiko', cells: [{ name: 'Rwamiko' }, { name: 'Cyumba' }, { name: 'Rubaya' }] },
          { name: 'Shangasha', cells: [{ name: 'Shangasha' }, { name: 'Cyumba' }, { name: 'Rubaya' }] }
        ]
      }
    ]
  },
  {
    name: 'Southern Province',
    districts: [
      {
        name: 'Gisagara',
        sectors: [
          { name: 'Gishubi', cells: [{ name: 'Gishubi' }, { name: 'Kigembe' }, { name: 'Mukindo' }] },
          { name: 'Gikonko', cells: [{ name: 'Gikonko' }, { name: 'Kigembe' }, { name: 'Mukindo' }] },
          { name: 'Kansi', cells: [{ name: 'Kansi' }, { name: 'Kigembe' }, { name: 'Mukindo' }] },
          { name: 'Kibirizi', cells: [{ name: 'Kibirizi' }, { name: 'Kigembe' }, { name: 'Mukindo' }] },
          { name: 'Kigembe', cells: [{ name: 'Kigembe' }, { name: 'Gishubi' }, { name: 'Mukindo' }] },
          { name: 'Mamba', cells: [{ name: 'Mamba' }, { name: 'Kigembe' }, { name: 'Mukindo' }] },
          { name: 'Muganza', cells: [{ name: 'Muganza' }, { name: 'Kigembe' }, { name: 'Mukindo' }] },
          { name: 'Mukindo', cells: [{ name: 'Mukindo' }, { name: 'Gishubi' }, { name: 'Kigembe' }] },
          { name: 'Ndora', cells: [{ name: 'Ndora' }, { name: 'Kigembe' }, { name: 'Mukindo' }] },
          { name: 'Nyanza', cells: [{ name: 'Nyanza' }, { name: 'Kigembe' }, { name: 'Mukindo' }] },
          { name: 'Rweru', cells: [{ name: 'Rweru' }, { name: 'Kigembe' }, { name: 'Mukindo' }] },
          { name: 'Save', cells: [{ name: 'Save' }, { name: 'Kigembe' }, { name: 'Mukindo' }] }
        ]
      },
      {
        name: 'Huye',
        sectors: [
          { name: 'Gishamvu', cells: [{ name: 'Gishamvu' }, { name: 'Tumba' }, { name: 'Mukura' }] },
          { name: 'Huye', cells: [{ name: 'Huye' }, { name: 'Tumba' }, { name: 'Mukura' }] },
          { name: 'Karama', cells: [{ name: 'Karama' }, { name: 'Tumba' }, { name: 'Mukura' }] },
          { name: 'Kigoma', cells: [{ name: 'Kigoma' }, { name: 'Tumba' }, { name: 'Mukura' }] },
          { name: 'Kinazi', cells: [{ name: 'Kinazi' }, { name: 'Tumba' }, { name: 'Mukura' }] },
          { name: 'Maraba', cells: [{ name: 'Maraba' }, { name: 'Tumba' }, { name: 'Mukura' }] },
          { name: 'Mbazi', cells: [{ name: 'Mbazi' }, { name: 'Tumba' }, { name: 'Mukura' }] },
          { name: 'Mukura', cells: [{ name: 'Mukura' }, { name: 'Gishamvu' }, { name: 'Tumba' }] },
          { name: 'Ngoma', cells: [{ name: 'Ngoma' }, { name: 'Tumba' }, { name: 'Mukura' }] },
          { name: 'Ruhashya', cells: [{ name: 'Ruhashya' }, { name: 'Tumba' }, { name: 'Mukura' }] },
          { name: 'Rusatira', cells: [{ name: 'Rusatira' }, { name: 'Tumba' }, { name: 'Mukura' }] },
          { name: 'Rwaniro', cells: [{ name: 'Rwaniro' }, { name: 'Tumba' }, { name: 'Mukura' }] },
          { name: 'Simbi', cells: [{ name: 'Simbi' }, { name: 'Tumba' }, { name: 'Mukura' }] },
          { name: 'Tumba', cells: [{ name: 'Tumba' }, { name: 'Gishamvu' }, { name: 'Mukura' }] }
        ]
      },
      {
        name: 'Kamonyi',
        sectors: [
          { name: 'Gacurabwenge', cells: [{ name: 'Gacurabwenge' }, { name: 'Nyamiyaga' }, { name: 'Rukoma' }] },
          { name: 'Kamonyi', cells: [{ name: 'Kamonyi' }, { name: 'Nyamiyaga' }, { name: 'Rukoma' }] },
          { name: 'Kayenzi', cells: [{ name: 'Kayenzi' }, { name: 'Nyamiyaga' }, { name: 'Rukoma' }] },
          { name: 'Kayumbu', cells: [{ name: 'Kayumbu' }, { name: 'Nyamiyaga' }, { name: 'Rukoma' }] },
          { name: 'Mugina', cells: [{ name: 'Mugina' }, { name: 'Nyamiyaga' }, { name: 'Rukoma' }] },
          { name: 'Musambira', cells: [{ name: 'Musambira' }, { name: 'Nyamiyaga' }, { name: 'Rukoma' }] },
          { name: 'Nyamiyaga', cells: [{ name: 'Nyamiyaga' }, { name: 'Gacurabwenge' }, { name: 'Rukoma' }] },
          { name: 'Nyarubaka', cells: [{ name: 'Nyarubaka' }, { name: 'Nyamiyaga' }, { name: 'Rukoma' }] },
          { name: 'Runda', cells: [{ name: 'Runda' }, { name: 'Nyamiyaga' }, { name: 'Rukoma' }] },
          { name: 'Rukoma', cells: [{ name: 'Rukoma' }, { name: 'Gacurabwenge' }, { name: 'Nyamiyaga' }] }
        ]
      }
    ]
  },
  {
    name: 'Western Province',
    districts: [
      {
        name: 'Karongi',
        sectors: [
          { name: 'Bwishyura', cells: [{ name: 'Bwishyura' }, { name: 'Rugabano' }, { name: 'Mutuntu' }] },
          { name: 'Gashari', cells: [{ name: 'Gashari' }, { name: 'Rugabano' }, { name: 'Mutuntu' }] },
          { name: 'Gishyita', cells: [{ name: 'Gishyita' }, { name: 'Rugabano' }, { name: 'Mutuntu' }] },
          { name: 'Gitesi', cells: [{ name: 'Gitesi' }, { name: 'Rugabano' }, { name: 'Mutuntu' }] },
          { name: 'Murambi', cells: [{ name: 'Murambi' }, { name: 'Rugabano' }, { name: 'Mutuntu' }] },
          { name: 'Mutuntu', cells: [{ name: 'Mutuntu' }, { name: 'Bwishyura' }, { name: 'Rugabano' }] },
          { name: 'Rugabano', cells: [{ name: 'Rugabano' }, { name: 'Bwishyura' }, { name: 'Mutuntu' }] },
          { name: 'Ruganda', cells: [{ name: 'Ruganda' }, { name: 'Rugabano' }, { name: 'Mutuntu' }] },
          { name: 'Rwankuba', cells: [{ name: 'Rwankuba' }, { name: 'Rugabano' }, { name: 'Mutuntu' }] }
        ]
      },
      {
        name: 'Nyabihu',
        sectors: [
          { name: 'Bigogwe', cells: [{ name: 'Bigogwe' }, { name: 'Karago' }, { name: 'Mukamira' }] },
          { name: 'Jenda', cells: [{ name: 'Jenda' }, { name: 'Karago' }, { name: 'Mukamira' }] },
          { name: 'Jomba', cells: [{ name: 'Jomba' }, { name: 'Karago' }, { name: 'Mukamira' }] },
          { name: 'Kabatwa', cells: [{ name: 'Kabatwa' }, { name: 'Karago' }, { name: 'Mukamira' }] },
          { name: 'Karago', cells: [{ name: 'Karago' }, { name: 'Bigogwe' }, { name: 'Mukamira' }] },
          { name: 'Kintobo', cells: [{ name: 'Kintobo' }, { name: 'Karago' }, { name: 'Mukamira' }] },
          { name: 'Mukamira', cells: [{ name: 'Mukamira' }, { name: 'Bigogwe' }, { name: 'Karago' }] },
          { name: 'Rambura', cells: [{ name: 'Rambura' }, { name: 'Karago' }, { name: 'Mukamira' }] },
          { name: 'Rugera', cells: [{ name: 'Rugera' }, { name: 'Karago' }, { name: 'Mukamira' }] },
          { name: 'Shyira', cells: [{ name: 'Shyira' }, { name: 'Karago' }, { name: 'Mukamira' }] }
        ]
      },
      {
        name: 'Rubavu',
        sectors: [
          { name: 'Bugeshi', cells: [{ name: 'Bugeshi' }, { name: 'Nyundo' }, { name: 'Rubavu' }] },
          { name: 'Busasamana', cells: [{ name: 'Busasamana' }, { name: 'Nyundo' }, { name: 'Rubavu' }] },
          { name: 'Cyanzarwe', cells: [{ name: 'Cyanzarwe' }, { name: 'Nyundo' }, { name: 'Rubavu' }] },
          { name: 'Gisenyi', cells: [{ name: 'Gisenyi' }, { name: 'Nyundo' }, { name: 'Rubavu' }] },
          { name: 'Kanama', cells: [{ name: 'Kanama' }, { name: 'Nyundo' }, { name: 'Rubavu' }] },
          { name: 'Kanzenze', cells: [{ name: 'Kanzenze' }, { name: 'Nyundo' }, { name: 'Rubavu' }] },
          { name: 'Mudende', cells: [{ name: 'Mudende' }, { name: 'Nyundo' }, { name: 'Rubavu' }] },
          { name: 'Nyakiliba', cells: [{ name: 'Nyakiliba' }, { name: 'Nyundo' }, { name: 'Rubavu' }] },
          { name: 'Nyamyumba', cells: [{ name: 'Nyamyumba' }, { name: 'Nyundo' }, { name: 'Rubavu' }] },
          { name: 'Nyundo', cells: [{ name: 'Nyundo' }, { name: 'Bugeshi' }, { name: 'Rubavu' }] },
          { name: 'Rubavu', cells: [{ name: 'Rubavu' }, { name: 'Bugeshi' }, { name: 'Nyundo' }] },
          { name: 'Rugerero', cells: [{ name: 'Rugerero' }, { name: 'Nyundo' }, { name: 'Rubavu' }] }
        ]
      }
    ]
  }
];

// Helper functions to get location data
export const getProvinces = (): string[] => {
  return rwandaProvinces.map(province => province.name);
};

export const getDistrictsByProvince = (provinceName: string): string[] => {
  const province = rwandaProvinces.find(p => p.name === provinceName);
  return province?.districts?.map(district => district.name) || [];
};

export const getSectorsByDistrict = (provinceName: string, districtName: string): string[] => {
  const province = rwandaProvinces.find(p => p.name === provinceName);
  const district = province?.districts?.find(d => d.name === districtName);
  return district?.sectors?.map(sector => sector.name) || [];
};

export const getCellsBySector = (provinceName: string, districtName: string, sectorName: string): string[] => {
  const province = rwandaProvinces.find(p => p.name === provinceName);
  const district = province?.districts?.find(d => d.name === districtName);
  const sector = district?.sectors?.find(s => s.name === sectorName);
  return sector?.cells?.map(cell => cell.name) || [];
};