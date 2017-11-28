<?php
/**
 * Implements Special:ConvertSubtitle
 *
 * @file
 * @ingroup SpecialPage
 */

use MediaWiki\MediaWikiServices;

class SpecialConvertSubtitle extends SpecialPage {
	public function __construct() {
		parent::__construct( 'ConvertSubtitle' );
	}

	public function execute( $par ) {
		$request = $this->getRequest();
		$output = $this->getOutput();
		$output->enableOOUI();

		$target = $request->getText('wpSRT');

		$fields = [];

		$fields[] = new OOUI\FieldLayout(
			new OOUI\ButtonInputWidget( [
				'name' => 'wpDo',
				'value' => 'Convert',
				'label' => 'Convert',
				'flags' => [ 'primary', 'progressive' ],
				'type' => 'submit',
			] ),
			[
				'align' => 'top',
			]
		);

		$fields[] = new OOUI\MultilineTextInputWidget( [
			    'name' => 'wpSRT',
			    'id' => 'wpSRT',
			    'maxLength' => 1000000,
			    'infusable' => true,
			    'value' => ''
		] );

		$fieldset = new OOUI\FieldsetLayout( [
			  'label' => 'Convert SRT to Intelligent Archive subtitles',
			  'id'    => 'conv',
			  'items' => $fields,
		] );

		$form = new OOUI\FormLayout( [
			'method' => 'post',
			'action' => $this->getPageTitle()->getLocalURL( 'action=submit' ),
			'id' => 'convert',
		] );

		$form->appendContent(
			$fieldset
		);

		$output->addHTML( new OOUI\PanelLayout( [
				  'classes' => [],
				  'expanded' => false,
				  'padded' => true,
				  'framed' => true,
				  'content' => $form,
			] )
		);
		
		if ( 'submit' == $request->getVal( 'action' ) && $request->wasPosted()) {
			$lines = explode("\n", $target);
			$result = "";
			$current = "";
			$currentTime = 0;

			for ($i = 0; $i < count($lines); $i += 4) {
			    $ind = $lines[$i];
			    $time = $lines[$i+1];
			    $caption = $lines[$i+2];
			    $matches = [];

			    preg_match(
"/([0-9][0-9]):([0-9][0-9]):([0-9][0-9])[,.][0-9][0-9][0-9]\s+-->\s+([0-9][0-9]):([0-9][0-9]):([0-9][0-9])[,.][0-9][0-9][0-9]/", $time, $matches);

	    			$startTime = intVal($matches[1]) * 3600 + intVal($matches[2]) * 60 + intVal($matches[3]);
				$endTime = intVal($matches[4]) * 3600 + intVal($matches[5]) * 60 + intVal($matches[6]);
				
				if ($startTime > $currentTime + 3) {
					$timeStr = "$matches[1]:$matches[2]:$matches[3]";
					$result .= "&lt;subtitle id='$timeStr'&gt;$current&lt;/subtitle&gt;<br>";
					$currentTime = $startTime;
					$current = $caption;
				} else {
				        $current .= ' ' . $caption;
				}
			}
			$result .= "&lt;subtitle id='$currentTime'&gt;$current&lt;/subtitle&gt;<br>";

			$output->addHTML($result);
		}
			
	}
}
