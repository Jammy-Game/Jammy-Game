import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Carousel.css";


/**
 * @prop carouselData => This props must have carousel items!!!
 * @prop autoplay => optional : default false
 * @prop autoplaySpeed => optional : default 5000
 * @prop centerMode => optional : default false
 * @prop dots => optional : default false
 * @prop fade => optional : default false
 * @prop infinite => optional : default false
 * @prop initialSlide => optional : default 0
 * @prop speed => optional : default 500
 * @prop slidesToShow => optional : default 1
 * @prop slidesToScroll => optional : default 1
 * @prop nextArrow => optional : JSX.Element  
 * @prop prevArrow => optional : JSX.Element  
 */
const Carousel = (props) => {
  var settings = {
    autoplay: props.autoplay ?? false,
    autoplaySpeed: props.autoplaySpeed ?? 5000,
    className: props.className ?? "",
    centerMode: props.centerMode ?? false,
    dots: props.dots ?? false,
    fade: props.fade ?? false,
    initialSlide : props.initialSlide??0,
    infinite: props.infinite ?? false,
    speed: props.speed ?? 500,
    slidesToShow: props.slidesToShow ?? 1,
    slidesToScroll: props.slidesToScroll ?? 1,
    nextArrow: props.nextArrow ?? null,
    prevArrow: props.prevArrow ?? null,
  };
  return (
    <>
      <Slider {...settings}>{props.carouselData}</Slider>
    </>
  );
};

export default Carousel;
