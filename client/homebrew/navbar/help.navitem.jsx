import React from 'react';
import Nav from './nav.jsx';

export default function(props){
	return <Nav.dropdown>
		<Nav.item color='grey' icon='fas fa-question-circle'>
			need help?
		</Nav.item>
		<Nav.item color='red' icon='fas fa-fw fa-bug'
			href='https://github.com/gavmor/homebrewery/issues'
			newTab={true}
			rel='noopener noreferrer'>
			report issue
		</Nav.item>
		<Nav.item color='green' icon='fas fa-question-circle'
			href='/faq'
			newTab={true}
			rel='noopener noreferrer'>
			FAQ
		</Nav.item>
		<Nav.item color='blue' icon='fas fa-fw fa-file-import'
			href='/migrate'
			newTab={true}
			rel='noopener noreferrer'>
			migrate
		</Nav.item>
	</Nav.dropdown>;
};
