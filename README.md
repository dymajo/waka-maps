# waka-maps

These are the scripts we use to generate tiles and upload to S3 bucket. That said, don't use the powershell script, just run `s3 sync .\ s3://thebucket/osm_tiles` from ./output. It's faster because it batches the uploads. Zoom levels go to 17 unless specified.

Below is a list of the currently uploaded maps.

## maps-ap-southeast-2.dymajo.com

### Aotearoa

* [nz-n](https://maps-ap-southeast-2.dymajo.com/osm_tiles/nz-n.json) (Te Ika-a-Māui - Zoom Levels to 10)
* [nz-s](https://maps-ap-southeast-2.dymajo.com/osm_tiles/nz-s.json) (Te Waipounamu - Zoom Levels to 10)
* [nz-akl](https://maps-ap-southeast-2.dymajo.com/osm_tiles/nz-akl.json) (Tāmaki Makaurau)
* [nz-wlg](https://maps-ap-southeast-2.dymajo.com/osm_tiles/nz-wlg.json) (Te Whanganui-a-Tara)
* [nz-chc](https://maps-ap-southeast-2.dymajo.com/osm_tiles/nz-chc.json) (Ōtautahi)
